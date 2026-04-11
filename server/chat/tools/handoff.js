import { createAssistantPayload } from '../render.js';
import { mergeConversationState, resetConversationState } from '../state.js';

export async function toolHandoff({ session, interpretation }) {
  const nextState = mergeConversationState(session, {
    flow: 'handoff',
    stage: 'handoff',
    intent: interpretation.intent,
    lastAction: 'handoff',
    pendingPrompt: { type: '', nextStep: '', context: {} },
    conversationFlags: {
      ...session.conversationFlags,
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
        interpretation.reply ||
        'Передаю запрос администратору. Мы свяжемся с вами и поможем вручную.',
      action: 'handoff',
      state: nextState,
      fallbackReason: interpretation.fallbackReason || undefined,
      meta: {
        flow: nextState.flow,
        stage: nextState.stage,
        confidence: interpretation.confidence,
        toolUsed: 'tool_handoff_request',
      },
    }),
    toolUsed: 'tool_handoff_request',
  };
}

export async function toolRestartConversation() {
  const nextState = mergeConversationState(resetConversationState(), {
    lastAction: 'ask_followup',
  });

  return {
    session: nextState,
    response: createAssistantPayload({
      reply:
        'Хорошо, остановим текущий сценарий. Если захотите, заново подберу врача, время или помогу с отменой записи.',
      action: 'ask_followup',
      state: nextState,
      meta: {
        flow: nextState.flow,
        stage: nextState.stage,
        confidence: 1,
        toolUsed: 'tool_handoff_request',
      },
    }),
    toolUsed: 'tool_handoff_request',
    clearState: true,
  };
}
