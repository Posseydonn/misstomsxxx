import { normalizeConversationState } from './state.js';

export function createAssistantPayload({
  reply,
  action,
  state,
  availability,
  bookingForm,
  booking,
  cancellation,
  fallbackReason,
  meta,
}) {
  return {
    reply,
    action,
    state: normalizeConversationState(state),
    ...(availability ? { availability } : {}),
    ...(bookingForm ? { bookingForm } : {}),
    ...(booking ? { booking } : {}),
    ...(cancellation ? { cancellation } : {}),
    ...(fallbackReason ? { fallbackReason } : {}),
    ...(meta ? { meta } : {}),
  };
}

export function buildBookingForm(state, errors = {}) {
  return {
    slot: {
      doctorName: state.slots.doctorName,
      dateIso: state.slots.dateIso,
      time: state.slots.time,
    },
    values: {
      name: state.slots.name || '',
      phone: state.slots.phone || '',
    },
    validation: errors,
    fields: [
      { name: 'name', label: 'Имя', type: 'text', required: true },
      { name: 'phone', label: 'Телефон', type: 'tel', required: true },
    ],
  };
}

export function buildCancellationPayload(state) {
  if (state.stage === 'confirm_cancellation' && state.slots.claimId) {
    return {
      status: 'confirm',
      claimId: state.slots.claimId,
      doctorName: state.slots.doctorName || undefined,
      dateIso: state.slots.dateIso || undefined,
      time: state.slots.time || undefined,
    };
  }

  if (state.stage === 'cancelled') {
    return {
      status: 'cancelled',
      claimId: state.slots.claimId || '',
    };
  }

  return {
    status: 'need_claim_id',
    claimId: state.slots.claimId || '',
  };
}
