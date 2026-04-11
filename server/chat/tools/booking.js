import { createAppointment, getAvailabilityDigest } from '../../services/medflex.js';
import {
  CLINIC,
  MEDFLEX_DEFAULTS,
  SERVICE_MEDFLEX_MAP,
  SERVICES,
  buildSlotPickedReply,
  inferServiceSlugFromPage,
  inferServiceSlugFromText,
  inferSlotsFromPayload,
  resolveSpecialityId,
  validateBookingForm,
} from '../domain.js';
import { buildBookingForm, createAssistantPayload } from '../render.js';
import { mergeConversationState } from '../state.js';

export async function toolShowBookingForm({ session, interpretation, request }) {
  const nextState = mergeConversationState(session, {
    flow: 'booking',
    stage: 'collect_contact',
    intent: interpretation.intent,
    lastAction: 'show_booking_form',
    pendingPrompt: { type: '', nextStep: '', context: {} },
    triage: interpretation.triage,
    slots: inferSlotsFromPayload(
      interpretation.entities,
      request.trimmedMessage,
      session,
      request.pageContext
    ),
    ui: {
      type: 'booking_form',
    },
    conversationFlags: {
      ...session.conversationFlags,
      awaitingConfirmation: true,
    },
  });

  const hasSlot = nextState.slots.dateIso && nextState.slots.time;
  return {
    session: nextState,
    response: createAssistantPayload({
      reply: hasSlot
        ? buildSlotPickedReply(nextState)
        : 'Сначала выберите врача и удобное время, а потом я сразу оформлю запись.',
      action: hasSlot ? 'show_booking_form' : 'show_availability',
      state: nextState,
      bookingForm: hasSlot ? buildBookingForm(nextState) : undefined,
      meta: {
        flow: nextState.flow,
        stage: nextState.stage,
        confidence: interpretation.confidence,
        toolUsed: 'tool_show_booking_form',
      },
    }),
    toolUsed: 'tool_show_booking_form',
  };
}

export async function toolConfirmBooking({ session, interpretation, request }) {
  const mergedState = mergeConversationState(session, {
    flow: 'booking',
    stage: 'collect_contact',
    intent: interpretation.intent,
    pendingPrompt: { type: '', nextStep: '', context: {} },
    triage: interpretation.triage,
    slots: inferSlotsFromPayload(
      interpretation.entities,
      request.trimmedMessage,
      session,
      request.pageContext
    ),
    ui: {
      type: 'booking_form',
    },
    conversationFlags: {
      ...session.conversationFlags,
      awaitingConfirmation: true,
    },
  });

  const errors = validateBookingForm(mergedState.slots);
  if (errors.name || errors.phone || !mergedState.slots.dateIso || !mergedState.slots.time) {
    return {
      session: mergedState,
      response: createAssistantPayload({
        reply:
          !mergedState.slots.dateIso || !mergedState.slots.time
            ? 'Сначала выберите удобное время, а потом я оформлю запись.'
            : 'Проверьте, пожалуйста, имя и телефон. После этого я сразу оформлю запись.',
        action:
          !mergedState.slots.dateIso || !mergedState.slots.time
            ? 'show_availability'
            : 'show_booking_form',
        state: mergedState,
        bookingForm:
          !mergedState.slots.dateIso || !mergedState.slots.time
            ? undefined
            : buildBookingForm(mergedState, errors),
        meta: {
          flow: mergedState.flow,
          stage: mergedState.stage,
          confidence: interpretation.confidence,
          toolUsed: 'tool_create_booking',
        },
      }),
      toolUsed: 'tool_create_booking',
    };
  }

  if (
    session.lastAction === 'confirm_booking' &&
    session.stage === 'completed' &&
    session.slots.claimId &&
    session.slots.name === mergedState.slots.name &&
    session.slots.phone === mergedState.slots.phone
  ) {
    return {
      session,
      response: createAssistantPayload({
        reply: 'Эта запись уже подтверждена. Повторно оформлять ее не нужно.',
        action: 'confirm_booking',
        state: session,
        booking: {
          date: session.slots.dateIso,
          time: session.slots.time,
          doctor: session.slots.doctorName,
          confirmationCode: session.slots.claimId,
        },
        meta: {
          flow: session.flow,
          stage: session.stage,
          confidence: 1,
          toolUsed: 'tool_create_booking',
        },
      }),
      toolUsed: 'tool_create_booking',
    };
  }

  const serviceSlug =
    mergedState.slots.service ||
    inferServiceSlugFromText(request.trimmedMessage) ||
    inferServiceSlugFromPage(request.pageContext) ||
    'treatment';
  const serviceMap = SERVICE_MEDFLEX_MAP[serviceSlug] || null;
  const doctorId =
    mergedState.slots.doctorId || serviceMap?.doctor_id || MEDFLEX_DEFAULTS.doctor_id;
  const specialityId =
    serviceMap?.speciality_id ||
    resolveSpecialityId(doctorId) ||
    MEDFLEX_DEFAULTS.speciality_id;
  const lpuId =
    serviceMap?.lpu_id || CLINIC.branches[0]?.medflex_lpu_id || MEDFLEX_DEFAULTS.lpu_id;

  const liveAvailability = await getAvailabilityDigest({
    lpuId,
    days: 7,
    maxSlotsPerDoctor: Number.MAX_SAFE_INTEGER,
    doctorIds: doctorId ? [doctorId] : [],
    dateIso: mergedState.slots.dateIso,
  });

  const exactSlotStillAvailable = liveAvailability.onlineDoctors.some(
    (doctor) =>
      doctor.doctorId === doctorId &&
      doctor.slots.includes(formatAvailabilitySlot(mergedState.slots.dateIso, mergedState.slots.time))
  );

  if (!exactSlotStillAvailable) {
    const nextState = mergeConversationState(mergedState, {
      flow: 'booking',
      stage: 'select_slot',
      lastAction: 'show_availability',
      slots: {
        time: '',
      },
      ui: {
        type: 'availability',
      },
      conversationFlags: {
        ...mergedState.conversationFlags,
        awaitingConfirmation: false,
      },
    });

    return {
      session: nextState,
      response: createAssistantPayload({
        reply: 'Это время уже занято. Показываю актуальные свободные окна на эту дату.',
        action: 'show_availability',
        state: nextState,
        availability: liveAvailability,
        meta: {
          flow: nextState.flow,
          stage: nextState.stage,
          confidence: interpretation.confidence,
          toolUsed: 'tool_create_booking',
        },
      }),
      medflexResult: liveAvailability,
      toolUsed: 'tool_create_booking',
    };
  }

  try {
    const booking = await createAppointment({
      fullName: mergedState.slots.name,
      phone: mergedState.slots.phone,
      preferredTime: mergedState.slots.time,
      service: SERVICES.find((item) => item.slug === serviceSlug)?.name || serviceSlug,
      doctorId,
      doctorName: mergedState.slots.doctorName,
      lpuId,
      specialityId,
      price: serviceMap?.price ?? MEDFLEX_DEFAULTS.price,
      selectedSlot: {
        dateIso: mergedState.slots.dateIso,
        time: mergedState.slots.time,
      },
    });

    const nextState = mergeConversationState(mergedState, {
      flow: 'booking',
      stage: 'completed',
      lastAction: 'confirm_booking',
      slots: {
        claimId: booking.confirmationCode,
        doctorId,
        doctorName: booking.doctor || mergedState.slots.doctorName,
      },
      bookingContext: {
        status: 'confirmed',
        selectedSlot: {
          dateIso: mergedState.slots.dateIso,
          time: mergedState.slots.time,
          doctorName: booking.doctor || mergedState.slots.doctorName,
        },
        lastBooking: booking,
      },
      conversationFlags: {
        ...mergedState.conversationFlags,
        awaitingConfirmation: false,
      },
      ui: {
        type: 'booking_confirmation',
      },
    });

    return {
      session: nextState,
      response: createAssistantPayload({
        reply: 'Готово, запись подтверждена. Ниже оставила детали визита.',
        action: 'confirm_booking',
        state: nextState,
        booking: {
          ...booking,
          date: nextState.slots.dateIso,
          time: nextState.slots.time,
          doctor: booking.doctor || nextState.slots.doctorName,
        },
        meta: {
          flow: nextState.flow,
          stage: nextState.stage,
          confidence: interpretation.confidence,
          toolUsed: 'tool_create_booking',
        },
      }),
      medflexResult: booking,
      toolUsed: 'tool_create_booking',
    };
  } catch (error) {
    const errorMessage = String(error?.message || '');
    const isClinicBalanceIssue = /Недостаточно средств на балансе клиники/i.test(errorMessage);

    const nextState = mergeConversationState(mergedState, {
      flow: 'handoff',
      stage: 'handoff',
      lastAction: 'handoff',
      conversationFlags: {
        ...mergedState.conversationFlags,
        needsHuman: true,
        awaitingConfirmation: false,
      },
    });

    return {
      session: nextState,
      response: createAssistantPayload({
        reply: isClinicBalanceIssue
          ? 'Автоматическая запись сейчас временно недоступна. Я передам заявку администратору, чтобы с вами связались и подтвердили визит вручную.'
          : 'Сейчас не получилось автоматически оформить запись. Я передам заявку администратору, и с вами свяжутся вручную.',
        action: 'handoff',
        state: nextState,
        bookingForm: buildBookingForm(mergedState),
        fallbackReason: errorMessage,
        meta: {
          flow: nextState.flow,
          stage: nextState.stage,
          confidence: interpretation.confidence,
          toolUsed: 'tool_create_booking',
        },
      }),
      medflexResult: { error: errorMessage },
      toolUsed: 'tool_create_booking',
    };
  }
}

function formatAvailabilitySlot(dateIso, time) {
  if (!(dateIso && time)) return '';
  const [year, month, day] = dateIso.split('-');
  return `${day}.${month}.${year} ${time}`;
}
