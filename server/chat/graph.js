import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { buildInformationalReply, detectDeterministicConsultationIntent, inferServiceSlug, inferSpecialtyFromTopic } from './domain.js';
import { interpretUserMessage } from './interpreter.js';
import { buildBookingForm, createAssistantPayload } from './render.js';
import { ChatGraphState, mergeConversationState } from './state.js';
import { toolShowAvailability } from './tools/availability.js';
import { toolConfirmBooking, toolShowBookingForm } from './tools/booking.js';
import { toolConfirmCancellation, toolStartCancellation } from './tools/cancellation.js';
import { toolHandoff, toolRestartConversation } from './tools/handoff.js';

const memorySaver = new MemorySaver();

function buildGraph() {
  const graph = new StateGraph(ChatGraphState)
    .addNode('interpret_user_message', async (state) => {
      const interpretation = await interpretUserMessage({
        history: state.context.history,
        pageContext: state.request.pageContext,
        state: state.session,
        trimmedMessage: state.request.trimmedMessage,
        clientAction: state.request.clientAction,
      });

      return {
        interpretation,
        meta: {
          flow: state.session.flow,
          stage: state.session.stage,
          confidence: interpretation.confidence,
          toolUsed: '',
        },
      };
    })
    .addNode('route_by_state', async (state) => ({
      route: decideNextNode(state),
    }))
    .addNode('urgent_triage', async (state) => {
      const nextState = mergeConversationState(state.session, {
        flow: 'handoff',
        stage: 'urgent_triage',
        intent: 'handoff',
        lastAction: 'handoff',
        triage: state.interpretation.triage,
        pendingPrompt: { type: '', nextStep: '', context: {} },
        conversationFlags: {
          ...state.session.conversationFlags,
          needsHuman: true,
        },
        ui: {
          type: 'handoff',
        },
      });

      return {
        session: nextState,
        response: createAssistantPayload({
          reply:
            state.interpretation.reply ||
            'Похоже, нужен срочный осмотр. Я сразу передам запрос администратору, чтобы с вами быстро связались.',
          action: 'handoff',
          state: nextState,
          meta: {
            flow: nextState.flow,
            stage: nextState.stage,
            confidence: state.interpretation.confidence,
            toolUsed: 'graph_urgent_triage',
          },
        }),
        meta: {
          flow: nextState.flow,
          stage: nextState.stage,
          confidence: state.interpretation.confidence,
          toolUsed: 'graph_urgent_triage',
        },
      };
    })
    .addNode('recommend_specialist', async (state) => {
      const consultation =
        detectDeterministicConsultationIntent(state.request.trimmedMessage) || state.interpretation;
      const nextState = mergeConversationState(state.session, {
        flow: 'consultation',
        stage: 'recommend_specialist',
        intent: state.interpretation.intent,
        lastAction: 'recommend_specialist',
        pendingPrompt: {
          type: 'offer_availability',
          nextStep: 'show_availability',
          context: {
            service:
              consultation.entities?.service ||
              inferServiceSlug({
                text: state.request.trimmedMessage,
                pageContext: state.request.pageContext,
                state: state.session,
              }),
            specialty:
              consultation.entities?.specialty ||
              inferSpecialtyFromTopic(consultation.entities?.topic) ||
              state.session.slots.specialty,
          },
        },
        triage: state.interpretation.triage,
        slots: {
          specialty:
            consultation.entities?.specialty ||
            inferSpecialtyFromTopic(consultation.entities?.topic) ||
            state.session.slots.specialty,
          service:
            consultation.entities?.service ||
            inferServiceSlug({
              text: state.request.trimmedMessage,
              pageContext: state.request.pageContext,
              state: state.session,
            }),
        },
        ui: {
          type: 'none',
        },
      });

      return {
        session: nextState,
        response: createAssistantPayload({
          reply:
            state.interpretation.reply ||
            'Лучше начать с консультации подходящего специалиста. Если хотите, сразу покажу ближайшие окна.',
          action: 'recommend_specialist',
          state: nextState,
          meta: {
            flow: nextState.flow,
            stage: nextState.stage,
            confidence: state.interpretation.confidence,
            toolUsed: 'graph_recommend_specialist',
          },
        }),
        meta: {
          flow: nextState.flow,
          stage: nextState.stage,
          confidence: state.interpretation.confidence,
          toolUsed: 'graph_recommend_specialist',
        },
      };
    })
    .addNode('show_availability', async (state) => {
      const result = await toolShowAvailability(state);
      return {
        session: result.session,
        response: result.response,
        meta: {
          flow: result.session.flow,
          stage: result.session.stage,
          confidence: state.interpretation.confidence,
          toolUsed: result.toolUsed,
        },
      };
    })
    .addNode('collect_contact', async (state) => {
      const result = await toolShowBookingForm(state);
      return {
        session: result.session,
        response: result.response,
        meta: {
          flow: result.session.flow,
          stage: result.session.stage,
          confidence: state.interpretation.confidence,
          toolUsed: result.toolUsed,
        },
      };
    })
    .addNode('confirm_booking', async (state) => {
      try {
        const result = await toolConfirmBooking(state);
        return {
          session: result.session,
          response: result.response,
          meta: {
            flow: result.session.flow,
            stage: result.session.stage,
            confidence: state.interpretation.confidence,
            toolUsed: result.toolUsed,
          },
        };
      } catch (error) {
        return handoffResult(state, error.message);
      }
    })
    .addNode('start_cancellation', async (state) => {
      const result = await toolStartCancellation({
        session: state.session,
        history: state.context.history,
        interpretation: state.interpretation,
      });
      return {
        session: result.session,
        response: result.response,
        meta: {
          flow: result.session.flow,
          stage: result.session.stage,
          confidence: state.interpretation.confidence,
          toolUsed: result.toolUsed,
        },
      };
    })
    .addNode('confirm_cancellation', async (state) => {
      try {
        const result = await toolConfirmCancellation({
          session: state.session,
          interpretation: state.interpretation,
        });
        return {
          session: result.session,
          response: result.response,
          meta: {
            flow: result.session.flow,
            stage: result.session.stage,
            confidence: state.interpretation.confidence,
            toolUsed: result.toolUsed,
          },
        };
      } catch (error) {
        return handoffResult(state, error.message);
      }
    })
    .addNode('handoff', async (state) => {
      const result = await toolHandoff({
        session: state.session,
        interpretation: state.interpretation,
      });
      return {
        session: result.session,
        response: result.response,
        meta: {
          flow: result.session.flow,
          stage: result.session.stage,
          confidence: state.interpretation.confidence,
          toolUsed: result.toolUsed,
        },
      };
    })
    .addNode('answer_info', async (state) => {
      if (state.interpretation.signals.deny && !state.interpretation.signals.wantsHuman) {
        const result = await toolRestartConversation();
        return {
          session: result.session,
          response: result.response,
          meta: {
            flow: result.session.flow,
            stage: result.session.stage,
            confidence: state.interpretation.confidence,
            toolUsed: result.toolUsed,
          },
        };
      }

      const infoReply = buildInformationalReply({
        text: state.request.trimmedMessage,
        pageContext: state.request.pageContext,
        state: state.session,
      });

      const nextState = mergeConversationState(state.session, {
        flow: state.session.flow === 'idle' ? 'pricing' : state.session.flow,
        stage:
          state.interpretation.confidence < 0.4
            ? 'clarify'
            : state.session.stage === 'collect_contact'
              ? 'collect_contact'
              : state.session.stage || 'clarify',
        intent: state.interpretation.intent,
        lastAction: state.interpretation.requestedAction,
        triage: state.interpretation.triage,
        pendingPrompt:
          infoReply?.nextStep && !infoReply.autoContinue
            ? {
                type: 'offer_next_step',
                nextStep: infoReply.nextStep,
                context: infoReply.entities || {},
              }
            : { type: '', nextStep: '', context: {} },
        slots: {
          service: inferServiceSlug({
            text: state.request.trimmedMessage,
            pageContext: state.request.pageContext,
            state: state.session,
          }),
        },
        ui:
          state.session.stage === 'collect_contact'
            ? { type: 'booking_form' }
            : { type: 'none' },
      });

      const reply =
        infoReply?.reply ||
        state.interpretation.reply ||
        'Помогу с записью. Напишите, что нужно: лечение, имплантация, цена или отмена визита.';

      return {
        session: nextState,
        response: createAssistantPayload({
          reply,
          action: state.interpretation.requestedAction || 'ask_followup',
          state: nextState,
          bookingForm:
            nextState.stage === 'collect_contact' ? buildBookingForm(nextState) : undefined,
          meta: {
            flow: nextState.flow,
            stage: nextState.stage,
            confidence: state.interpretation.confidence,
            toolUsed: 'graph_answer_info',
          },
        }),
        meta: {
          flow: nextState.flow,
          stage: nextState.stage,
          confidence: state.interpretation.confidence,
          toolUsed: 'graph_answer_info',
        },
      };
    })
    .addEdge(START, 'interpret_user_message')
    .addEdge('interpret_user_message', 'route_by_state')
    .addConditionalEdges('route_by_state', (state) => state.route, {
      urgent_triage: 'urgent_triage',
      recommend_specialist: 'recommend_specialist',
      show_availability: 'show_availability',
      collect_contact: 'collect_contact',
      confirm_booking: 'confirm_booking',
      start_cancellation: 'start_cancellation',
      confirm_cancellation: 'confirm_cancellation',
      handoff: 'handoff',
      answer_info: 'answer_info',
    })
    .addEdge('urgent_triage', END)
    .addEdge('recommend_specialist', END)
    .addEdge('show_availability', END)
    .addEdge('collect_contact', END)
    .addEdge('confirm_booking', END)
    .addEdge('start_cancellation', END)
    .addEdge('confirm_cancellation', END)
    .addEdge('handoff', END)
    .addEdge('answer_info', END);

  return graph.compile({
    checkpointer: memorySaver,
    name: 'clinic-chat-v2',
  });
}

function decideNextNode(state) {
  const { interpretation, request, session } = state;
  const action = interpretation.requestedAction;
  const clientType = request.clientAction?.type;

  if (
    clientType === 'slot_pick' ||
    clientType === 'booking_form_submit' ||
    clientType === 'cancellation_confirm' ||
    clientType === 'cancellation_lookup' ||
    clientType === 'cancel_start'
  ) {
    if (clientType === 'slot_pick') return 'collect_contact';
    if (clientType === 'booking_form_submit') return 'confirm_booking';
    if (clientType === 'cancellation_confirm') return 'confirm_cancellation';
    if (clientType === 'cancellation_lookup') {
      return interpretation.entities.claimId ? 'confirm_cancellation' : 'start_cancellation';
    }
    return 'start_cancellation';
  }

  if (interpretation.triage?.level === 'urgent') {
    return 'urgent_triage';
  }

  if (session.pendingPrompt?.nextStep && interpretation.intent === 'continue_flow' && interpretation.signals.affirm) {
    if (session.pendingPrompt.nextStep === 'show_availability') {
      return 'show_availability';
    }
  }

  if (action === 'cancel_booking' || interpretation.intent === 'cancel') {
    return session.stage === 'confirm_cancellation' || interpretation.signals.affirm
      ? 'confirm_cancellation'
      : 'start_cancellation';
  }

  if (action === 'show_booking_form') {
    return 'collect_contact';
  }

  if (action === 'confirm_booking') {
    return 'confirm_booking';
  }

  if (
    interpretation.signals.wantsHuman ||
    action === 'handoff' ||
    interpretation.intent === 'handoff'
  ) {
    return 'handoff';
  }

  if (action === 'recommend_specialist') {
    return 'recommend_specialist';
  }

  if (action === 'show_availability' || interpretation.signals.wantsAvailability) {
    return 'show_availability';
  }

  if (interpretation.signals.deny && !interpretation.signals.wantsHuman) {
    return 'answer_info';
  }

  return 'answer_info';
}

function handoffResult(state, reason) {
  const nextState = mergeConversationState(state.session, {
    flow: 'handoff',
    stage: 'handoff',
    lastAction: 'handoff',
    pendingPrompt: { type: '', nextStep: '', context: {} },
    conversationFlags: {
      ...state.session.conversationFlags,
      needsHuman: true,
    },
  });

  return {
    session: nextState,
    response: createAssistantPayload({
      reply:
        'Сейчас не получилось автоматически завершить этот шаг. Я передам заявку администратору, чтобы с вами связались.',
      action: 'handoff',
      state: nextState,
      fallbackReason: reason,
      meta: {
        flow: nextState.flow,
        stage: nextState.stage,
        confidence: state.interpretation.confidence,
        toolUsed: 'tool_handoff_request',
      },
    }),
    meta: {
      flow: nextState.flow,
      stage: nextState.stage,
      confidence: state.interpretation.confidence,
      toolUsed: 'tool_handoff_request',
    },
  };
}

let compiledGraph;

export function getChatGraph() {
  if (!compiledGraph) {
    compiledGraph = buildGraph();
  }
  return compiledGraph;
}
