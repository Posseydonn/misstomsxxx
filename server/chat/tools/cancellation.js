import { cancelAppointment } from '../../services/medflex.js';
import { extractLastBookingFromHistory } from '../domain.js';
import { buildCancellationPayload, createAssistantPayload } from '../render.js';
import { mergeConversationState, resetConversationState } from '../state.js';

export async function toolStartCancellation({ session, history, interpretation }) {
  const lastBooking = session.slots.claimId ? null : extractLastBookingFromHistory(history);
  const nextState = mergeConversationState(session, {
    flow: 'cancellation',
    stage: session.slots.claimId || lastBooking?.confirmationCode ? 'confirm_cancellation' : 'collect_claim_id',
    intent: interpretation.intent,
    lastAction: 'cancel_booking',
    pendingPrompt: { type: '', nextStep: '', context: {} },
    slots: {
      claimId: interpretation.entities.claimId || session.slots.claimId || lastBooking?.confirmationCode || '',
      doctorName: session.slots.doctorName || lastBooking?.doctor || '',
      dateIso: session.slots.dateIso || lastBooking?.date || '',
      time: session.slots.time || lastBooking?.time || '',
    },
    ui: {
      type: 'cancellation',
    },
  });

  return {
    session: nextState,
    response: createAssistantPayload({
      reply: nextState.slots.claimId
        ? `У меня есть код вашей последней записи ${nextState.slots.claimId}. Подтвердите отмену, и я все сделаю.`
        : 'Подскажу с отменой записи. Введите, пожалуйста, код записи, чтобы я нашла визит.',
      action: 'cancel_booking',
      state: nextState,
      cancellation: buildCancellationPayload(nextState),
      meta: {
        flow: nextState.flow,
        stage: nextState.stage,
        confidence: interpretation.confidence,
        toolUsed: 'tool_cancel_booking',
      },
    }),
    toolUsed: 'tool_cancel_booking',
  };
}

export async function toolConfirmCancellation({ session, interpretation }) {
  const claimId = String(interpretation.entities.claimId || session.slots.claimId || '').trim();
  if (!claimId) {
    const nextState = mergeConversationState(session, {
      flow: 'cancellation',
      stage: 'collect_claim_id',
      lastAction: 'cancel_booking',
      pendingPrompt: { type: '', nextStep: '', context: {} },
      ui: {
        type: 'cancellation',
      },
    });

    return {
      session: nextState,
      response: createAssistantPayload({
        reply: 'Чтобы отменить запись, нужен код записи. Введите его, пожалуйста.',
        action: 'cancel_booking',
        state: nextState,
        cancellation: buildCancellationPayload(nextState),
        meta: {
          flow: nextState.flow,
          stage: nextState.stage,
          confidence: interpretation.confidence,
          toolUsed: 'tool_cancel_booking',
        },
      }),
      toolUsed: 'tool_cancel_booking',
    };
  }

  const medflexResult = await cancelAppointment(claimId);
  const nextState = mergeConversationState(resetConversationState(), {
    flow: 'idle',
    stage: 'cancelled',
    lastAction: 'cancel_booking',
    slots: {
      claimId,
    },
    ui: {
      type: 'cancellation',
    },
  });

  return {
    session: nextState,
    response: createAssistantPayload({
      reply: 'Готово, запись отменена. Если захотите, я помогу подобрать новое время.',
      action: 'cancel_booking',
      state: nextState,
      cancellation: {
        status: 'cancelled',
        claimId,
      },
      meta: {
        flow: nextState.flow,
        stage: nextState.stage,
        confidence: interpretation.confidence,
        toolUsed: 'tool_cancel_booking',
      },
    }),
    medflexResult,
    toolUsed: 'tool_cancel_booking',
  };
}
