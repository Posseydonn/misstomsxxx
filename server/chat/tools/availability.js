import { getAvailabilityDigest } from '../../services/medflex.js';
import {
  CLINIC,
  MEDFLEX_DEFAULTS,
  buildAvailabilityQuery,
  buildAvailabilityReply,
} from '../domain.js';
import { createAssistantPayload } from '../render.js';
import { mergeConversationState } from '../state.js';

export async function toolShowAvailability({ session, interpretation, request }) {
  const rawQuery = buildAvailabilityQuery({
    message: request.trimmedMessage,
    params: interpretation.entities,
    state: session,
    pageContext: request.pageContext,
  });
  const query = applyRepairContext(rawQuery, session, interpretation);

  const lpuId = CLINIC.branches[0]?.medflex_lpu_id ?? MEDFLEX_DEFAULTS.lpu_id;

  const availabilityRaw =
    query.requestedDoctors.length > 0 && query.doctorIds.length === 0
      ? {
          onlineDoctors: [],
          offlineDoctors: query.requestedDoctors.map((doctor) => ({
            name: doctor.name,
            role: doctor.role,
          })),
          filters: { doctorIds: [], dateIso: query.dateIso || '' },
        }
      : await getAvailabilityDigest({
          lpuId,
          days: 7,
          maxSlotsPerDoctor:
            query.dateIso || query.doctorIds.length > 0 ? Number.MAX_SAFE_INTEGER : 8,
          doctorIds: query.doctorIds,
          dateIso: query.dateIso,
        });
  const availability = applyAvailabilityRepairFilters(availabilityRaw, session, interpretation);

  const firstDoctor = availability.onlineDoctors[0];
  const nextState = mergeConversationState(session, {
    flow: 'booking',
    stage: 'select_slot',
    intent: interpretation.intent,
    lastAction: 'show_availability',
    pendingPrompt: { type: '', nextStep: '', context: {} },
    triage: interpretation.triage,
    slots: {
      doctorId:
        query.doctorIds[0] ||
        firstDoctor?.doctorId ||
        (interpretation.signals.changeDoctor ? null : session.slots.doctorId),
      doctorName:
        query.requestedDoctors[0]?.name ||
        firstDoctor?.name ||
        (interpretation.signals.changeDoctor ? '' : session.slots.doctorName),
      dateIso:
        interpretation.signals.changeDate || interpretation.signals.changeTime
          ? query.dateIso || ''
          : query.dateIso || session.slots.dateIso,
      time:
        interpretation.signals.changeDate || interpretation.signals.changeTime
          ? ''
          : session.slots.time,
      service: interpretation.entities.service || session.slots.service,
      specialty: interpretation.entities.specialty || session.slots.specialty,
    },
    ui: {
      type: 'availability',
    },
    conversationFlags: {
      ...session.conversationFlags,
      lowConfidence: interpretation.confidence < 0.55,
    },
  });

  const baseReply = buildAvailabilityReply(query, availability);
  const reply = interpretation.reply
    ? `${interpretation.reply} ${baseReply}`.trim()
    : baseReply;

  return {
    session: nextState,
    response: createAssistantPayload({
      reply,
      action: 'show_availability',
      state: nextState,
      availability,
      meta: {
        flow: nextState.flow,
        stage: nextState.stage,
        confidence: interpretation.confidence,
        toolUsed: 'tool_show_availability',
      },
    }),
    medflexResult: availability,
    toolUsed: 'tool_show_availability',
  };
}

function applyRepairContext(query, session, interpretation) {
  const nextQuery = {
    doctorIds: Array.isArray(query.doctorIds) ? [...query.doctorIds] : [],
    dateIso: query.dateIso || '',
    requestedDoctors: Array.isArray(query.requestedDoctors) ? [...query.requestedDoctors] : [],
  };

  if (interpretation.signals.changeDoctor && !interpretation.entities.doctorName) {
    nextQuery.doctorIds = nextQuery.doctorIds.filter((doctorId) => doctorId !== session.slots.doctorId);
    nextQuery.requestedDoctors = [];
  }

  if (
    (interpretation.signals.changeDate || interpretation.signals.changeTime) &&
    !interpretation.entities.dateIso
  ) {
    nextQuery.dateIso = '';
  }

  return nextQuery;
}

function applyAvailabilityRepairFilters(availability, session, interpretation) {
  let onlineDoctors = Array.isArray(availability.onlineDoctors)
    ? [...availability.onlineDoctors]
    : [];
  let offlineDoctors = Array.isArray(availability.offlineDoctors)
    ? [...availability.offlineDoctors]
    : [];

  if (interpretation.signals.changeDoctor && !interpretation.entities.doctorName) {
    onlineDoctors = onlineDoctors.filter((doctor) => doctor.doctorId !== session.slots.doctorId);
    offlineDoctors = offlineDoctors.filter((doctor) => doctor.name !== session.slots.doctorName);
  }

  if (interpretation.signals.changeDate && !interpretation.entities.dateIso && session.slots.dateIso) {
    const currentDateLabel = formatAvailabilityDate(session.slots.dateIso);
    onlineDoctors = onlineDoctors
      .map((doctor) => ({
        ...doctor,
        slots: Array.isArray(doctor.slots)
          ? doctor.slots.filter((slot) => !slot.startsWith(currentDateLabel))
          : [],
      }))
      .filter((doctor) => doctor.slots.length > 0);
  }

  return {
    ...availability,
    onlineDoctors,
    offlineDoctors,
  };
}

function formatAvailabilityDate(dateIso) {
  const [year, month, day] = String(dateIso || '').split('-');
  if (!(year && month && day)) return '';
  return `${day}.${month}.${year}`;
}
