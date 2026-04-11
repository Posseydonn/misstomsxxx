import {
  CLINIC,
  DOCTOR_CATALOG,
  MEDFLEX_DEFAULTS,
  SERVICES,
  SERVICE_MEDFLEX_MAP,
} from '../config/clinic.js';
import { normalizePhone } from '../services/medflex.js';

export {
  CLINIC,
  DOCTOR_CATALOG,
  MEDFLEX_DEFAULTS,
  SERVICES,
  SERVICE_MEDFLEX_MAP,
};

const SHORT_AFFIRMATION_RE =
  /^(да|ага|угу|давай|давайте|хорошо|ок|окей|можно|подходит|согласен|согласна)$/;

const AVAILABILITY_CONTINUE_RE =
  /(?:покаж|показ|подбер|расписан|окн|слот|время|запис|прием|приём|консультац|дальше|к записи|к слотам|оформим|ближайш|вариант|подходит)/;

const BOOKING_NOW_RE =
  /(?:запис|запись|окн|слот|время|прием|приём|показать расписание|покажите расписание|подобрать время|выбрать время|к записи|к слотам)/;

export function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .map((message) => {
      if (!message || typeof message !== 'object') return null;
      if (message.role !== 'user' && message.role !== 'assistant') return null;
      return {
        role: message.role,
        content: String(message.content || ''),
        ...(message.action ? { action: message.action } : {}),
        ...(message.availability ? { availability: message.availability } : {}),
        ...(message.booking ? { booking: message.booking } : {}),
        ...(message.bookingForm ? { bookingForm: message.bookingForm } : {}),
        ...(message.cancellation ? { cancellation: message.cancellation } : {}),
        ...(message.state ? { state: message.state } : {}),
      };
    })
    .filter(Boolean);
}

export function sanitizeHistoryForModel(history) {
  return normalizeHistory(history).map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export function validateBookingForm(slots) {
  const errors = {};

  if (!String(slots.name || '').trim()) {
    errors.name = 'Укажите имя';
  }

  const normalized = normalizePhone(String(slots.phone || ''));
  if (!/^7\d{10}$/.test(normalized)) {
    errors.phone = 'Укажите телефон в формате +7';
  }

  return errors;
}

export function resolveDoctorByName(name = '') {
  const normalized = normalizeRu(name);
  if (!normalized) return null;

  return (
    DOCTOR_CATALOG.find((doctor) =>
      normalizeRu(doctor.name)
        .split(/\s+/)
        .filter((token) => token.length >= 4)
        .some((token) => normalized.includes(token.slice(0, 5)))
    ) || null
  );
}

export function resolveDoctorId(name = '') {
  return resolveDoctorByName(name)?.medflex_doctor_id ?? null;
}

export function resolveSpecialityId(doctorId) {
  return (
    DOCTOR_CATALOG.find((doctor) => doctor.medflex_doctor_id === doctorId)?.speciality_ids?.[0] ??
    null
  );
}

export function inferServiceSlugFromText(text = '') {
  const lower = normalizeRu(text);
  if (!lower) return '';

  const mapping = {
    implantation: ['имплант', 'отсутствует зуб', 'нет зуба', 'удаленный зуб', 'удалённый зуб'],
    veneers: ['винир'],
    braces: ['брекет', 'элайнер', 'прикус'],
    hygiene: ['гигиен', 'чистк'],
    treatment: ['лечен', 'лечение', 'кариес', 'болит зуб', 'пульпит', 'зуб болит'],
    whitening: ['отбелив'],
    pediatric: ['детск', 'ребенок', 'ребёнок'],
    diagnostics: ['кт', 'снимок', 'диагност'],
    prosthetics: ['протез', 'коронк', 'ортопед'],
  };

  for (const [slug, tokens] of Object.entries(mapping)) {
    if (tokens.some((token) => lower.includes(token))) {
      return slug;
    }
  }

  if (hasBridgeSignal(lower)) {
    return 'prosthetics';
  }

  return '';
}

export function inferServiceSlugFromPage(pageContext = '') {
  const match = String(pageContext || '').match(/\/services\/([a-z-]+)/);
  return match?.[1] || '';
}

export function inferSpecialtyFromTopic(topic = '') {
  if (topic === 'tooth_pain') return 'терапевт';
  if (topic === 'missing_tooth') return 'хирург-имплантолог';
  if (topic === 'implant_interest') return 'хирург-имплантолог';
  if (topic === 'prosthetics_interest') return 'ортопед';
  return '';
}

export function inferServiceSlug({ text = '', pageContext = '', state = null, fallback = '' } = {}) {
  return (
    inferServiceSlugFromText(text) ||
    inferServiceSlugFromPage(pageContext) ||
    (state?.slots?.service || '') ||
    fallback
  );
}

const AFFIRMATION_TOKENS = new Set([
  'да',
  'ага',
  'угу',
  'давай',
  'давайте',
  'хорошо',
  'ок',
  'окей',
  'можно',
  'подходит',
  'согласен',
  'согласна',
]);

const AFFIRMATION_FILLER_TOKENS = new Set([
  'ну',
  'тогда',
  'ладно',
  'пожалуйста',
  'то',
  'сразу',
]);

export function isAffirmation(text = '') {
  const normalized = normalizeRu(text);
  if (!normalized) return false;
  if (SHORT_AFFIRMATION_RE.test(normalized)) return true;

  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (!tokens.some((token) => AFFIRMATION_TOKENS.has(token))) {
    return false;
  }

  return tokens.every(
    (token) => AFFIRMATION_TOKENS.has(token) || AFFIRMATION_FILLER_TOKENS.has(token)
  );
}

export function isPendingStepContinuation(text = '', pendingPrompt = null) {
  if (!pendingPrompt?.nextStep) return false;

  const normalized = normalizeRu(text);
  if (!normalized) return false;

  if (SHORT_AFFIRMATION_RE.test(normalized)) {
    return true;
  }

  if (pendingPrompt.nextStep === 'show_availability') {
    if (/РїРѕРґСЃРєР°Р¶/.test(normalized)) {
      return true;
    }

    return AVAILABILITY_CONTINUE_RE.test(normalized);
  }

  return false;
}

export function buildSlotPickedReply(state) {
  const dateLabel = formatIsoDate(state.slots.dateIso);
  return `Вы выбрали окно ${dateLabel} в ${state.slots.time} к ${state.slots.doctorName}. Оставьте, пожалуйста, имя и телефон для подтверждения записи.`;
}

export function buildAvailabilityReply(query, availability) {
  const hasDoctor = query.requestedDoctors.length > 0;
  const hasDate = Boolean(query.dateIso);

  if (availability.onlineDoctors.length === 0) {
    if (hasDoctor && hasDate) {
      return 'На эту дату у выбранного врача нет онлайн-окон. Могу показать ближайшие варианты.';
    }
    if (hasDoctor) {
      return 'У выбранного врача сейчас нет онлайн-окон. Могу подобрать ближайшие варианты.';
    }
    return 'Сейчас не вижу онлайн-окон по этому запросу. Могу подобрать ближайшие варианты.';
  }

  if (hasDoctor && hasDate) return 'Показываю свободные окна на выбранную дату.';
  if (hasDoctor) return 'Показываю ближайшие окна выбранного врача.';
  if (hasDate) return 'Показываю свободные окна на выбранную дату.';
  return 'Нашла ближайшие свободные окна. Выберите удобное время.';
}

export function buildAvailabilityQuery({ message = '', params = {}, state, pageContext }) {
  const parsed = parseAvailabilityQuery(message);
  const doctor = resolveDoctorByName(params.doctorName);
  const dateIso = params.dateIso || parsed.dateIso || state?.slots?.dateIso || '';
  const doctorIds = [...parsed.doctorIds];
  const requestedDoctors = [...parsed.requestedDoctors];

  if (doctor) {
    if (Number.isInteger(doctor.medflex_doctor_id) && !doctorIds.includes(doctor.medflex_doctor_id)) {
      doctorIds.push(doctor.medflex_doctor_id);
    }
    if (!requestedDoctors.some((item) => item.name === doctor.name)) {
      requestedDoctors.push({ name: doctor.name, role: doctor.role });
    }
  }

  if (!doctorIds.length && state?.slots?.doctorId) {
    doctorIds.push(state.slots.doctorId);
  }
  if (!requestedDoctors.length && state?.slots?.doctorName) {
    requestedDoctors.push({
      name: state.slots.doctorName,
      role: resolveDoctorByName(state.slots.doctorName)?.role || 'Специалист клиники',
    });
  }

  const serviceSlug =
    params.service ||
    inferServiceSlugFromText(message) ||
    inferServiceSlugFromPage(pageContext) ||
    state?.slots?.service;

  if (!doctorIds.length && serviceSlug && SERVICE_MEDFLEX_MAP[serviceSlug]?.doctor_id) {
    doctorIds.push(SERVICE_MEDFLEX_MAP[serviceSlug].doctor_id);
  }

  return {
    doctorIds,
    dateIso,
    requestedDoctors,
  };
}

export function inferSlotsFromPayload(params, trimmedMessage, state, pageContext) {
  const selectedFromMessage = parseSlotSelectionMessage(trimmedMessage);
  const serviceSlug =
    params.service ||
    inferServiceSlugFromText(trimmedMessage) ||
    inferServiceSlugFromPage(pageContext) ||
    state.slots.service;

  return {
    service: serviceSlug || '',
    specialty: params.specialty || params.doctorSpecialty || state.slots.specialty,
    doctorId:
      resolveDoctorId(params.doctorName) ||
      resolveDoctorId(selectedFromMessage?.doctorName) ||
      state.slots.doctorId ||
      SERVICE_MEDFLEX_MAP[serviceSlug]?.doctor_id ||
      null,
    doctorName:
      params.doctorName || selectedFromMessage?.doctorName || state.slots.doctorName || '',
    dateIso:
      params.dateIso ||
      toIsoFromDisplayDate(selectedFromMessage?.date || '') ||
      state.slots.dateIso,
    time: params.time || selectedFromMessage?.time || state.slots.time,
    name: params.name || state.slots.name,
    phone: params.phone || state.slots.phone,
    claimId: params.claimId || state.slots.claimId,
  };
}

export function detectRepairRequest(text = '', state) {
  const lower = normalizeRu(text);
  if (!lower) return null;

  if (/администратор|оператор|человек|перезвоните/.test(lower)) {
    return { type: 'handoff' };
  }

  if (/передумал|передумала|не надо|не нужно|стоп/.test(lower)) {
    return { type: 'restart' };
  }

  if (state.flow === 'booking' || state.stage === 'select_slot' || state.stage === 'collect_contact') {
    if (/другая дата|на другой день|другое время|другое окно|перенести на/.test(lower)) {
      return {
        type: 'change_date',
        dateIso: extractDateIso(text, lower),
      };
    }

    if (/не этот врач|другой врач|к другому врачу/.test(lower)) {
      const doctor = resolveDoctorByName(text);
      return {
        type: 'change_doctor',
        doctorId: doctor?.medflex_doctor_id ?? null,
        doctorName: doctor?.name ?? '',
      };
    }
  }

  return null;
}

export function isAvailabilityFollowup(text = '', state) {
  return (
    isPendingStepContinuation(text, state?.pendingPrompt) ||
    (SHORT_AFFIRMATION_RE.test(normalizeRu(text)) &&
      (state.stage === 'recommend_specialist' ||
        (state.flow === 'booking' && state.lastAction === 'recommend_specialist')))
  );
}

export function detectUrgentTriage(text = '') {
  const lower = normalizeRu(text);
  if (!lower) return { level: 'none', signals: [] };

  const signals = [];
  if (/температур|жар|озноб/.test(lower)) signals.push('fever');
  if (/отек|отёк|опух|распух|припух|вздул|раздул/.test(lower)) signals.push('swelling');
  if (/десн/.test(lower) && /отек|отёк|опух|распух|припух/.test(lower)) signals.push('gum_swelling');
  if (/флюс/.test(lower)) signals.push('abscess');
  if (/гно|гной|нагно/.test(lower)) signals.push('pus');
  if (/кровотеч|кровит|идет кровь|идёт кровь/.test(lower)) signals.push('bleeding');
  if (/сильн/.test(lower) && /(бол|боль|болит|болят)/.test(lower)) signals.push('severe_pain');

  const urgent =
    signals.includes('fever') ||
    signals.includes('swelling') ||
    signals.includes('gum_swelling') ||
    signals.includes('abscess') ||
    signals.includes('pus') ||
    signals.includes('bleeding') ||
    (signals.includes('severe_pain') && signals.includes('swelling'));

  if (urgent) return { level: 'urgent', signals };
  if (signals.includes('severe_pain')) return { level: 'attention', signals };
  return { level: 'none', signals };
}

export function extractLastBookingFromHistory(history) {
  const normalized = normalizeHistory(history);
  for (let index = normalized.length - 1; index >= 0; index -= 1) {
    const booking = normalized[index]?.booking;
    if (booking?.confirmationCode) {
      return booking;
    }
  }
  return null;
}

export function parseSlotSelectionMessage(message = '') {
  const match = String(message).match(
    /^Запиши меня к (.+?) на (\d{2}\.\d{2}\.\d{4}|\d{2}\.\d{2}) в (\d{2}:\d{2})$/i
  );
  if (!match) return null;

  return {
    doctorName: match[1].trim(),
    date: match[2],
    time: match[3],
  };
}

export function wantsAvailability(text = '') {
  const lower = normalizeRu(text);
  return (
    /(doctor|doctors|schedule|slot|slots|available|availability)/i.test(lower) ||
    /(врач|доктор|распис|слот|окн|свободн|доступн|когда можно|ближайш)/i.test(lower)
  );
}

export function shouldStartCancellation(text, state) {
  return /отмен(ить|а)|отмена записи|перенести/i.test(normalizeRu(text)) || state.flow === 'cancellation';
}

export function shouldShowAvailability(text, query, state) {
  if (wantsAvailability(text) || query.requestedDoctors.length > 0 || query.dateIso) {
    return true;
  }

  return isAvailabilityFollowup(text, state);
}

export function detectDeterministicConsultationIntent(text = '') {
  const lower = normalizeRu(text);

  if (hasToothPainSignal(lower)) {
    return {
      reply:
        'Похоже, лучше начать с консультации терапевта. Если хотите, я сразу покажу ближайшие окна.',
      requestedAction: 'recommend_specialist',
      entities: {
        specialty: 'терапевт',
        topic: 'tooth_pain',
        service: 'treatment',
      },
      intent: 'book',
      userGoal: 'Консультация из-за боли в зубе',
      confidence: 0.92,
    };
  }

  if (hasMissingToothSignal(lower)) {
    return {
      reply:
        'В таком случае лучше начать с консультации хирурга-имплантолога. Если хотите, я покажу ближайшие окна.',
      requestedAction: 'recommend_specialist',
      entities: {
        specialty: 'хирург-имплантолог',
        topic: 'missing_tooth',
        service: 'implantation',
      },
      intent: 'book',
      userGoal: 'Консультация по отсутствующему зубу',
      confidence: 0.95,
    };
  }

  if (hasImplantSignal(lower)) {
    return {
      reply:
        'Подскажу по имплантации и помогу записаться к хирургу-имплантологу. Если хотите, сразу покажу свободные окна.',
      requestedAction: 'recommend_specialist',
      entities: {
        specialty: 'хирург-имплантолог',
        topic: 'implant_interest',
        service: 'implantation',
      },
      intent: 'book',
      userGoal: 'Интерес к имплантации',
      confidence: 0.95,
    };
  }

  if (hasBridgeSignal(lower)) {
    return {
      reply:
        'РЎ СЌС‚РёРј Р»СѓС‡С€Рµ РЅР°С‡Р°С‚СЊ СЃ РєРѕРЅСЃСѓР»СЊС‚Р°С†РёРё РѕСЂС‚РѕРїРµРґР°. Р’СЂР°С‡ РїРѕСЃРјРѕС‚СЂРёС‚, РјРѕР¶РЅРѕ Р»Рё РІРµСЂРЅСѓС‚СЊ РјРѕСЃС‚ РЅР° РјРµСЃС‚Рѕ РёР»Рё РЅСѓР¶РµРЅ РЅРѕРІС‹Р№ РїСЂРѕС‚РµР·. Р•СЃР»Рё С…РѕС‚РёС‚Рµ, СЏ СЃСЂР°Р·Сѓ РїРѕРєР°Р¶Сѓ Р±Р»РёР¶Р°Р№С€РёРµ РѕРєРЅР°.',
      requestedAction: 'recommend_specialist',
      entities: {
        specialty: 'РѕСЂС‚РѕРїРµРґ',
        topic: 'prosthetics_interest',
        service: 'prosthetics',
      },
      intent: 'book',
      userGoal: 'РљРѕРЅСЃСѓР»СЊС‚Р°С†РёСЏ РїРѕ РјРѕСЃС‚Сѓ РёР»Рё РїСЂРѕС‚РµР·Сѓ',
      confidence: 0.95,
    };
  }

  if (hasProstheticsSignal(lower)) {
    return {
      reply:
        'С этим лучше начать с консультации ортопеда. Если хотите, я сразу покажу ближайшие окна.',
      requestedAction: 'recommend_specialist',
      entities: {
        specialty: 'ортопед',
        topic: 'prosthetics_interest',
        service: 'prosthetics',
      },
      intent: 'book',
      userGoal: 'Консультация по протезированию',
      confidence: 0.94,
    };
  }

  return null;
}

export function buildHeuristicInterpretation(text, state, fallbackReason = '') {
  const triage = detectUrgentTriage(text);

  if (triage.level === 'urgent') {
    return {
      intent: 'handoff',
      confidence: 0.98,
      signals: {
        affirm: false,
        deny: false,
        wantsHuman: true,
        changeDoctor: false,
        changeDate: false,
        changeTime: false,
        wantsAvailability: false,
      },
      entities: { topic: 'urgent_dental_issue' },
      triage,
      userGoal: 'Срочная помощь при острой симптоматике',
      reply:
        'Похоже, нужен срочный осмотр. Я сразу передам запрос администратору, чтобы с вами быстро связались.',
      missing: [],
      requestedAction: 'handoff',
      fallbackReason,
    };
  }

  if (shouldStartCancellation(text, state)) {
    return {
      intent: 'cancel',
      confidence: 0.85,
      signals: {
        affirm: false,
        deny: false,
        wantsHuman: false,
        changeDoctor: false,
        changeDate: false,
        changeTime: false,
        wantsAvailability: false,
      },
      entities: {},
      triage,
      userGoal: 'Отменить запись',
      reply: 'Подскажу с отменой записи. Введите, пожалуйста, код записи.',
      missing: ['claimId'],
      requestedAction: 'cancel_booking',
      fallbackReason,
    };
  }

  const consultation = detectDeterministicConsultationIntent(text);
  if (consultation) {
    return {
      intent: consultation.intent,
      confidence: consultation.confidence,
      signals: {
        affirm: false,
        deny: false,
        wantsHuman: false,
        changeDoctor: false,
        changeDate: false,
        changeTime: false,
        wantsAvailability: false,
      },
      entities: consultation.entities,
      triage,
      userGoal: consultation.userGoal,
      reply: consultation.reply,
      missing: [],
      requestedAction: consultation.requestedAction,
      fallbackReason,
    };
  }

  if (
    wantsAvailability(text) ||
    isAvailabilityFollowup(text, state) ||
    isPendingStepContinuation(text, state?.pendingPrompt)
  ) {
    return {
      intent: 'continue_flow',
      confidence: 0.82,
      signals: {
        affirm: true,
        deny: false,
        wantsHuman: false,
        changeDoctor: false,
        changeDate: false,
        changeTime: false,
        wantsAvailability: true,
      },
      entities: {},
      triage,
      userGoal: 'Показать свободные окна',
      reply: 'Сейчас покажу ближайшие свободные окна.',
      missing: [],
      requestedAction: 'show_availability',
      fallbackReason,
    };
  }

  const infoReply = buildInformationalReply({ text, state });
  if (infoReply) {
    return {
      intent: infoReply.intent,
      confidence: infoReply.confidence,
      signals: {
        affirm: false,
        deny: false,
        wantsHuman: false,
        changeDoctor: false,
        changeDate: false,
        changeTime: false,
        wantsAvailability: false,
      },
      entities: infoReply.entities,
      triage,
      userGoal: infoReply.userGoal,
      reply: infoReply.reply,
      missing: infoReply.missing,
      requestedAction: infoReply.autoContinue ? 'show_availability' : 'ask_followup',
      fallbackReason,
    };
  }

  return {
    intent: 'ask_info',
    confidence: 0.45,
    signals: {
      affirm: false,
      deny: false,
      wantsHuman: false,
      changeDoctor: false,
      changeDate: false,
      changeTime: false,
      wantsAvailability: false,
    },
    entities: {},
    triage,
    userGoal: 'Нужна помощь с маршрутизацией запроса',
    reply: 'Помогу с записью. Напишите, что нужно: лечение, имплантация, цена или отмена визита.',
    missing: [],
    requestedAction: 'ask_followup',
    fallbackReason,
  };
}

export function buildInformationalReply({ text = '', pageContext = '', state = null } = {}) {
  const lower = normalizeRu(text);
  const serviceSlug = inferServiceSlug({ text, pageContext, state });
  const service = SERVICES.find((item) => item.slug === serviceSlug) || null;
  const wantsBookingNow = BOOKING_NOW_RE.test(lower);

  if (/цен|стоимост|сколько стоит/.test(lower)) {
    if (!service) {
      return {
        intent: 'ask_price',
        confidence: 0.72,
        entities: {},
        userGoal: 'Узнать стоимость услуги',
        reply:
          'Подскажу по стоимости. Какая услуга вас интересует: имплантация, лечение, протезирование или другая?',
        missing: ['service'],
      };
    }

    return {
      intent: 'ask_price',
      confidence: 0.9,
      entities: { service: service.slug, specialty: service.doctorSpecialty },
      userGoal: `Узнать стоимость услуги ${service.name}`,
      reply: wantsBookingNow
        ? `${service.name} стоит ${service.priceLabel}. Сразу покажу ближайшие окна к ${service.doctorSpecialty}.`
        : `${service.name} стоит ${service.priceLabel}. Если хотите, покажу ближайшие окна к ${service.doctorSpecialty}.`,
      missing: [],
      nextStep: 'show_availability',
      autoContinue: wantsBookingNow,
    };
  }

  if (/часы|режим|график|когда работаете|во сколько работаете|расписание клиники/.test(lower)) {
    return {
      intent: 'ask_info',
      confidence: 0.9,
      entities: {},
      userGoal: 'Узнать режим работы клиники',
      reply: `Клиника работает ${CLINIC.hours}. Если хотите, дальше помогу подобрать врача и время.`,
      missing: [],
    };
  }

  if (/адрес|где вы|как вас найти|куда ехать/.test(lower)) {
    const branch = CLINIC.branches[0];
    return {
      intent: 'ask_info',
      confidence: 0.9,
      entities: {},
      userGoal: 'Узнать адрес клиники',
      reply: `${branch.name}: ${branch.address}. Если захотите, после этого сразу помогу с записью.`,
      missing: [],
    };
  }

  if (/телефон|номер|как связаться|контакты/.test(lower)) {
    const phones = CLINIC.branches
      .map((branch) => `${branch.name}: ${branch.phone}`)
      .join('. ');
    return {
      intent: 'ask_info',
      confidence: 0.9,
      entities: {},
      userGoal: 'Узнать контакты клиники',
      reply: `Связаться с клиникой можно так: ${phones}. Если удобнее, я помогу записаться прямо здесь.`,
      missing: [],
    };
  }

  return null;
}

export function parseAvailabilityQuery(message = '') {
  const lower = normalizeRu(message);
  const words = lower.split(/\s+/).filter(Boolean);
  const doctorIds = [];
  const requestedDoctors = [];

  for (const doctor of DOCTOR_CATALOG) {
    const tokens = doctor.name
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length >= 4);
    const stems = tokens.map((token) => normalizeRu(token).slice(0, 5));
    const matched = stems.some((stem) => words.some((word) => normalizeRu(word).startsWith(stem)));
    if (!matched) continue;

    requestedDoctors.push({ name: doctor.name, role: doctor.role });
    if (Number.isInteger(doctor.medflex_doctor_id)) {
      doctorIds.push(doctor.medflex_doctor_id);
    }
  }

  return {
    doctorIds,
    dateIso: extractDateIso(message, lower),
    requestedDoctors,
  };
}

export function extractDateIso(message = '', lowerNormalized = '') {
  const now = new Date();
  const currentYear = now.getFullYear();

  const numericDmy = String(message).match(/\b(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\b/);
  if (numericDmy) {
    const dd = numericDmy[1].padStart(2, '0');
    const mm = numericDmy[2].padStart(2, '0');
    const yearRaw = numericDmy[3];
    const yyyy = yearRaw ? (yearRaw.length === 2 ? `20${yearRaw}` : yearRaw) : String(currentYear);
    return `${yyyy}-${mm}-${dd}`;
  }

  if (/послезавтра/.test(lowerNormalized)) {
    const date = new Date(now);
    date.setDate(date.getDate() + 2);
    return toIsoDate(date);
  }
  if (/сегодня/.test(lowerNormalized)) {
    return toIsoDate(now);
  }
  if (/завтра/.test(lowerNormalized)) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    return toIsoDate(date);
  }

  const textDate =
    String(message)
      .toLowerCase()
      .match(/(?:^|\D)(\d{1,2})\s+([\p{L}]{3,})/u) ||
    lowerNormalized.match(/(?:^|\D)(\d{1,2})\s+([\p{L}]{3,})/u);

  if (!textDate) return '';

  const day = Number(textDate[1]);
  const monthToken = normalizeRu(textDate[2]);
  if (!Number.isInteger(day) || day < 1 || day > 31) return '';

  const monthNumber = monthFromToken(monthToken);
  if (!monthNumber) return '';

  return `${currentYear}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function toIsoFromDisplayDate(value = '') {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parts = value.split('.');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  }
  if (parts.length === 2) {
    const now = new Date();
    return `${now.getFullYear()}-${parts[1]}-${parts[0]}`;
  }
  return '';
}

export function formatIsoDate(value = '') {
  if (!value) return 'в выбранное время';
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return value;
  }
}

function hasBridgeSignal(lower = '') {
  return /РјРѕСЃС‚/.test(lower);
}

export function normalizeRu(input = '') {
  return String(input)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{Script=Cyrillic}a-z0-9\s.-]/giu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function monthFromToken(token = '') {
  const monthMap = [
    ['янв', 1],
    ['фев', 2],
    ['мар', 3],
    ['апр', 4],
    ['май', 5],
    ['мая', 5],
    ['июн', 6],
    ['июл', 7],
    ['авг', 8],
    ['сен', 9],
    ['окт', 10],
    ['ноя', 11],
    ['дек', 12],
  ];

  for (const [prefix, month] of monthMap) {
    if (token.startsWith(prefix)) return month;
  }
  return 0;
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hasToothPainSignal(lower = '') {
  return (
    /зуб/.test(lower) &&
    /(бол|боль|болит|болят|разбол|ноет|ныет|ныть|ноющ|дергает|дергаит|реагирует|чувствител)/.test(
      lower
    )
  );
}

function hasMissingToothSignal(lower = '') {
  return (
    /нет .*зуб|нет зуб/.test(lower) ||
    /без .*зуб|без зуб/.test(lower) ||
    /отсутств/.test(lower) ||
    /удален.*зуб/.test(lower) ||
    /удаленн.*зуб/.test(lower) ||
    /потерял.*зуб/.test(lower) ||
    /восстановить.*зуб/.test(lower) ||
    /пустое место/.test(lower)
  );
}

function hasImplantSignal(lower = '') {
  return /имплант/.test(lower);
}

function hasProstheticsSignal(lower = '') {
  return /корон|протез|ортопед/.test(lower);
}
