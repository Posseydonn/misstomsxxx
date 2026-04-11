import { chat as gigaChat } from '../services/gigachat.js';
import {
  buildAvailabilityQuery,
  buildInformationalReply,
  buildHeuristicInterpretation,
  detectDeterministicConsultationIntent,
  detectRepairRequest,
  detectUrgentTriage,
  SERVICES,
  isAffirmation,
  isAvailabilityFollowup,
  isPendingStepContinuation,
  parseSlotSelectionMessage,
  sanitizeHistoryForModel,
  shouldStartCancellation,
  shouldShowAvailability,
} from './domain.js';
import { createEmptyInterpretation } from './state.js';

const ALLOWED_ACTIONS = new Set([
  'ask_followup',
  'recommend_specialist',
  'show_availability',
  'show_booking_form',
  'confirm_booking',
  'cancel_booking',
  'handoff',
]);

const ALLOWED_INTENTS = new Set([
  'book',
  'cancel',
  'ask_price',
  'ask_info',
  'continue_flow',
  'change_selection',
  'confirm',
  'deny',
  'handoff',
]);

export async function interpretUserMessage({
  history,
  pageContext,
  state,
  trimmedMessage,
  clientAction,
}) {
  if (clientAction?.type === 'slot_pick') {
    return normalizeInterpretation({
      intent: 'book',
      confidence: 1,
      requestedAction: 'show_booking_form',
      userGoal: 'Выбран конкретный слот',
      reply: '',
      entities: clientAction.params || {},
    });
  }

  if (clientAction?.type === 'booking_form_submit') {
    return normalizeInterpretation({
      intent: 'confirm',
      confidence: 1,
      requestedAction: 'confirm_booking',
      userGoal: 'Подтвердить запись с контактами',
      reply: '',
      entities: clientAction.params || {},
    });
  }

  if (clientAction?.type === 'cancel_start') {
    return normalizeInterpretation({
      intent: 'cancel',
      confidence: 1,
      requestedAction: 'cancel_booking',
      userGoal: 'Начать отмену записи',
      reply: '',
    });
  }

  if (clientAction?.type === 'cancellation_lookup') {
    return normalizeInterpretation({
      intent: 'cancel',
      confidence: 1,
      requestedAction: 'cancel_booking',
      userGoal: 'Найти запись для отмены',
      reply: '',
      entities: clientAction.params || {},
    });
  }

  if (clientAction?.type === 'cancellation_confirm') {
    return normalizeInterpretation({
      intent: 'confirm',
      confidence: 1,
      requestedAction: 'cancel_booking',
      userGoal: 'Подтвердить отмену записи',
      reply: '',
      entities: clientAction.params || {},
      signals: { affirm: true },
    });
  }

  const urgentTriage = detectUrgentTriage(trimmedMessage);
  if (urgentTriage.level === 'urgent') {
    return normalizeInterpretation({
      intent: 'handoff',
      confidence: 0.99,
      requestedAction: 'handoff',
      userGoal: 'Срочная помощь при острой симптоматике',
      reply:
        'Похоже, нужен срочный осмотр. Я сразу передам запрос администратору, чтобы с вами быстро связались.',
      entities: {
        topic: 'urgent_dental_issue',
      },
      signals: {
        wantsHuman: true,
      },
      triage: urgentTriage,
    });
  }

  const bridgeIssueInterpretation = buildBridgeIssueInterpretation(trimmedMessage);
  if (bridgeIssueInterpretation) {
    return normalizeInterpretation({
      ...bridgeIssueInterpretation,
      triage: urgentTriage,
    });
  }

  const slotSelection = parseSlotSelectionMessage(trimmedMessage);
  if (slotSelection) {
    return normalizeInterpretation({
      intent: 'book',
      confidence: 0.98,
      requestedAction: 'show_booking_form',
      userGoal: 'Выбран конкретный слот текстом',
      reply: '',
      entities: slotSelection,
      triage: urgentTriage,
    });
  }

  const repairRequest = detectRepairRequest(trimmedMessage, state);
  if (repairRequest) {
    return normalizeRepairInterpretation(repairRequest, urgentTriage);
  }

  if (
    state.pendingPrompt?.nextStep &&
    (isAffirmation(trimmedMessage) ||
      isPendingStepContinuation(trimmedMessage, state.pendingPrompt) ||
      isGuidedContinuation(trimmedMessage, state.pendingPrompt))
  ) {
    return normalizeInterpretation({
      intent: 'continue_flow',
      confidence: 0.96,
      requestedAction: state.pendingPrompt.nextStep,
      userGoal: 'Подтверждение следующего шага',
      reply: '',
      entities: state.pendingPrompt.context || {},
      signals: {
        affirm: true,
        wantsAvailability: state.pendingPrompt.nextStep === 'show_availability',
      },
      triage: urgentTriage,
    });
  }

  if (
    state.lastAction === 'recommend_specialist' &&
    isPendingStepContinuation(trimmedMessage, {
      nextStep: 'show_availability',
    })
  ) {
    return normalizeInterpretation({
      intent: 'continue_flow',
      confidence: 0.9,
      requestedAction: 'show_availability',
      userGoal: 'Продолжить запись после рекомендации специалиста',
      reply: '',
      entities: {
        service: state.slots.service,
        specialty: state.slots.specialty,
      },
      signals: {
        affirm: true,
        wantsAvailability: true,
      },
      triage: urgentTriage,
    });
  }

  if (shouldStartCancellation(trimmedMessage, state)) {
    return normalizeInterpretation({
      intent: 'cancel',
      confidence: 0.9,
      requestedAction: 'cancel_booking',
      userGoal: 'Отменить запись',
      reply: 'Подскажу с отменой записи.',
      triage: urgentTriage,
    });
  }

  const contextualPriceInterpretation = buildContextualPriceInterpretation(trimmedMessage, state);
  if (contextualPriceInterpretation) {
    return normalizeInterpretation({
      ...contextualPriceInterpretation,
      triage: urgentTriage,
    });
  }

  const contextualUncertaintyInterpretation = buildContextualUncertaintyInterpretation(
    trimmedMessage,
    state
  );
  if (contextualUncertaintyInterpretation) {
    return normalizeInterpretation({
      ...contextualUncertaintyInterpretation,
      triage: urgentTriage,
    });
  }

  const availabilityQuery = buildAvailabilityQuery({
    message: trimmedMessage,
    pageContext,
    state,
  });

  if (shouldShowAvailability(trimmedMessage, availabilityQuery, state)) {
    return normalizeInterpretation({
      intent: 'continue_flow',
      confidence: isAvailabilityFollowup(trimmedMessage, state) ? 0.84 : 0.9,
      requestedAction: 'show_availability',
      userGoal: 'Показать свободные окна',
      reply: 'Сейчас покажу ближайшие свободные окна.',
      signals: {
        affirm: isAvailabilityFollowup(trimmedMessage, state),
        wantsAvailability: true,
      },
      triage: urgentTriage,
    });
  }

  const informationalReply = buildInformationalReply({
    text: trimmedMessage,
    pageContext,
    state,
  });
  if (informationalReply) {
    return normalizeInterpretation({
      intent: informationalReply.intent,
      confidence: informationalReply.confidence,
      requestedAction: informationalReply.autoContinue ? 'show_availability' : 'ask_followup',
      userGoal: informationalReply.userGoal,
      reply: informationalReply.reply,
      entities: informationalReply.entities,
      missing: informationalReply.missing,
      triage: urgentTriage,
    });
  }

  const consultation = detectDeterministicConsultationIntent(trimmedMessage);
  if (consultation) {
    return normalizeInterpretation({
      intent: consultation.intent,
      confidence: consultation.confidence,
      requestedAction: consultation.requestedAction,
      userGoal: consultation.userGoal,
      reply: consultation.reply,
      entities: consultation.entities,
      triage: urgentTriage,
    });
  }

  try {
    const raw = await gigaChat(buildModelMessages({ history, pageContext, state, trimmedMessage }));
    return normalizeInterpretation({
      ...parseInterpreterPayload(raw),
      triage: urgentTriage,
    });
  } catch (error) {
    return normalizeInterpretation(
      buildHeuristicInterpretation(trimmedMessage, state, error.message)
    );
  }
}

function buildModelMessages({ history, pageContext, state, trimmedMessage }) {
  const statePreview = {
    flow: state.flow,
    stage: state.stage,
    intent: state.intent,
    slots: state.slots,
    lastAction: state.lastAction,
    pendingPrompt: state.pendingPrompt,
    triage: state.triage,
  };

  return [
    {
      role: 'system',
      content: [
        'Ты интерпретатор сообщений для чата стоматологической клиники.',
        'Отвечай только JSON-объектом без markdown и без пояснений.',
        'Тебе нужно понять смысл сообщения пользователя в контексте текущего состояния.',
        'Ты не создаешь запись и не отменяешь ее сам, ты только предлагаешь следующий допустимый action.',
        'Допустимые intents: book, cancel, ask_price, ask_info, continue_flow, change_selection, confirm, deny, handoff.',
        'Допустимые actions: ask_followup, recommend_specialist, show_availability, show_booking_form, confirm_booking, cancel_booking, handoff.',
        `Контекст страницы: ${pageContext || 'не указан'}.`,
        `Текущее состояние: ${JSON.stringify(statePreview)}.`,
        'Верни JSON формата:',
        JSON.stringify({
          intent: 'book',
          confidence: 0.9,
          signals: {
            affirm: false,
            deny: false,
            wantsHuman: false,
            changeDoctor: false,
            changeDate: false,
            changeTime: false,
            wantsAvailability: false,
          },
          entities: {
            service: '',
            doctorName: '',
            specialty: '',
            dateIso: '',
            time: '',
            name: '',
            phone: '',
            claimId: '',
            topic: '',
          },
          userGoal: '',
          reply: '',
          missing: [],
          requestedAction: 'ask_followup',
        }),
      ].join('\n'),
    },
    ...sanitizeHistoryForModel(history),
    { role: 'user', content: trimmedMessage },
  ];
}

function parseInterpreterPayload(raw) {
  const content = String(raw || '').trim();
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : content;

  try {
    return JSON.parse(candidate);
  } catch {
    return buildHeuristicInterpretation(
      candidate,
      {
        flow: 'idle',
        stage: 'idle',
        slots: {},
        pendingPrompt: null,
        triage: { level: 'none', signals: [] },
      },
      'LLM_PARSE_FAILED'
    );
  }
}

function normalizeInterpretation(value) {
  const base = createEmptyInterpretation();
  const next = value && typeof value === 'object' ? value : {};
  const requestedAction = ALLOWED_ACTIONS.has(next.requestedAction)
    ? next.requestedAction
    : base.requestedAction;
  const intent = ALLOWED_INTENTS.has(next.intent) ? next.intent : base.intent;

  return {
    intent,
    confidence:
      typeof next.confidence === 'number' && Number.isFinite(next.confidence)
        ? Math.max(0, Math.min(1, next.confidence))
        : base.confidence,
    signals: {
      ...base.signals,
      ...(next.signals && typeof next.signals === 'object' ? next.signals : {}),
    },
    entities: {
      ...base.entities,
      ...(next.entities && typeof next.entities === 'object' ? next.entities : {}),
    },
    userGoal: typeof next.userGoal === 'string' ? next.userGoal : '',
    reply: typeof next.reply === 'string' ? next.reply : '',
    missing: Array.isArray(next.missing) ? next.missing : [],
    requestedAction,
    fallbackReason: typeof next.fallbackReason === 'string' ? next.fallbackReason : '',
    triage:
      next.triage && typeof next.triage === 'object'
        ? {
            level: next.triage.level || 'none',
            signals: Array.isArray(next.triage.signals) ? next.triage.signals : [],
          }
        : base.triage,
  };
}

function normalizeRepairInterpretation(repairRequest, triage) {
  if (repairRequest.type === 'handoff') {
    return normalizeInterpretation({
      intent: 'handoff',
      confidence: 1,
      requestedAction: 'handoff',
      userGoal: 'Передать диалог человеку',
      reply: 'Передаю запрос администратору.',
      signals: { wantsHuman: true },
      triage,
    });
  }

  if (repairRequest.type === 'restart') {
    return normalizeInterpretation({
      intent: 'deny',
      confidence: 1,
      requestedAction: 'ask_followup',
      userGoal: 'Остановить текущий сценарий',
      reply: 'Хорошо, остановим текущий сценарий.',
      signals: { deny: true },
      triage,
    });
  }

  if (repairRequest.type === 'change_date') {
    return normalizeInterpretation({
      intent: 'change_selection',
      confidence: 1,
      requestedAction: 'show_availability',
      userGoal: 'Сменить дату или время записи',
      reply: 'Хорошо, подберем другое время.',
      signals: { changeDate: true, changeTime: true, wantsAvailability: true },
      entities: { dateIso: repairRequest.dateIso || '' },
      triage,
    });
  }

  if (repairRequest.type === 'change_doctor') {
    return normalizeInterpretation({
      intent: 'change_selection',
      confidence: 1,
      requestedAction: 'show_availability',
      userGoal: 'Сменить врача',
      reply: repairRequest.doctorName
        ? 'Хорошо, покажу окна другого врача.'
        : 'Хорошо, подберем другого врача.',
      signals: { changeDoctor: true, wantsAvailability: Boolean(repairRequest.doctorName) },
      entities: {
        doctorName: repairRequest.doctorName || '',
      },
      triage,
    });
  }

  return createEmptyInterpretation();
}

function buildBridgeIssueInterpretation(trimmedMessage) {
  const normalized = normalizeSimple(trimmedMessage);
  if (!/мост/.test(normalized)) {
    return null;
  }

  if (!/(отвал|слетел|выпал|шата|слом|трещ|держ|постав)/.test(normalized)) {
    return null;
  }

  return {
    intent: 'book',
    confidence: 0.94,
    requestedAction: 'recommend_specialist',
    userGoal: 'Консультация по мосту или протезу',
    reply:
      'С этим лучше начать с консультации ортопеда. Врач посмотрит, можно ли вернуть мост на место или нужен новый протез. Если хотите, я сразу покажу ближайшие окна.',
    entities: {
      service: 'prosthetics',
      specialty: 'ортопед',
      topic: 'prosthetics_interest',
    },
  };
}

function buildContextualPriceInterpretation(trimmedMessage, state) {
  const normalized = normalizeSimple(trimmedMessage);
  if (!isContextualPricePrompt(normalized)) {
    return null;
  }

  const service = SERVICES.find((item) => item.slug === state?.slots?.service);
  if (!service) {
    return null;
  }

  return {
    intent: 'ask_price',
    confidence: 0.88,
    requestedAction: 'ask_followup',
    userGoal: `Узнать стоимость услуги ${service.name}`,
    reply: `${service.name} стоит ${service.priceLabel}. Если хотите, покажу ближайшие окна к ${service.doctorSpecialty}.`,
    entities: {
      service: service.slug,
      specialty: service.doctorSpecialty,
    },
  };
}

function buildContextualUncertaintyInterpretation(trimmedMessage, state) {
  const normalized = normalizeSimple(trimmedMessage);
  if (!isUncertainPrompt(normalized)) {
    return null;
  }

  const service = SERVICES.find((item) => item.slug === state?.slots?.service);
  if (!service) {
    return null;
  }

  const reply =
    service.slug === 'prosthetics'
      ? `Можно начать с консультации ${service.doctorSpecialty}. Врач посмотрит, можно ли вернуть мост на место или нужен новый протез. Если хотите, покажу ближайшие окна.`
      : `Можно начать с консультации ${service.doctorSpecialty}. Если хотите, покажу ближайшие окна.`;

  const shouldContinueToAvailability =
    state?.pendingPrompt?.nextStep === 'show_availability' || state?.lastAction === 'recommend_specialist';

  return {
    intent: shouldContinueToAvailability ? 'continue_flow' : 'ask_info',
    confidence: 0.82,
    requestedAction: shouldContinueToAvailability ? 'show_availability' : 'ask_followup',
    userGoal: `Помочь определиться по услуге ${service.name}`,
    reply,
    entities: {
      service: service.slug,
      specialty: service.doctorSpecialty,
    },
  };
}

function isContextualPricePrompt(normalized) {
  return /дорого|по цене|цена/.test(normalized);
}

function isUncertainPrompt(normalized) {
  return /не знаю|не уверен|не уверена|как лучше|что лучше|подскажите/.test(normalized);
}

function isGuidedContinuation(trimmedMessage, pendingPrompt) {
  if (pendingPrompt?.nextStep !== 'show_availability') {
    return false;
  }

  return /РїРѕРґСЃРєР°Р¶|РїРѕРєР°Р¶|РїРѕРґР±РµСЂ|РѕРєРЅ|РІСЂРµРјСЏ/.test(normalizeSimple(trimmedMessage));
}

function normalizeSimple(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{Script=Cyrillic}a-z0-9\s.-]/giu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
