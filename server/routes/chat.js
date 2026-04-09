import { Router } from 'express';
import { getHistory, saveHistory } from '../services/redis.js';
import { chat as gigaChat } from '../services/gigachat.js';
import { createAppointment, getAvailabilityDigest } from '../services/medflex.js';
import { logMessage } from '../services/postgres.js';
import { buildSystemPrompt, parseGigaChatResponse } from '../prompts/system.js';
import { MEDFLEX_DEFAULTS, SERVICE_MEDFLEX_MAP, CLINIC, DOCTOR_CATALOG } from '../config/clinic.js';

const router = Router();

router.post('/', async (req, res) => {
  const { message, sessionId, pageContext } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'message is required' });
  }
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId is required' });
  }
  if (message.length > 1000) {
    return res.status(400).json({ error: 'message too long' });
  }

  const trimmedMessage = message.trim();

  try {
    const history = await getHistory(sessionId);
    const availabilityQuery = parseAvailabilityQuery(trimmedMessage);

    if (wantsAvailability(trimmedMessage) || availabilityQuery.requestedDoctors.length > 0) {
      return await handleAvailabilityRequest({
        history,
        trimmedMessage,
        sessionId,
        pageContext,
        res,
        query: availabilityQuery,
      });
    }

    const systemPrompt = buildSystemPrompt(pageContext || '');
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: trimmedMessage },
    ];

    const rawResponse = await gigaChat(messages);
    const { reply, intent: parsedIntent } = parseGigaChatResponse(rawResponse);
    const normalizedIntent = normalizeIntent(parsedIntent);
    const fallbackIntent = inferBookingIntentFromText(trimmedMessage);
    const intent = normalizedIntent?.ready ? normalizedIntent : (fallbackIntent ?? normalizedIntent);

    await logMessage({
      sessionId,
      role: 'user',
      content: trimmedMessage,
      page: pageContext,
    });

    let booking = null;
    let bookingError = null;

    if (intent?.type === 'book_appointment' && intent?.ready && hasBookingParams(intent)) {
      try {
        const serviceSlug = slugFromServiceName(intent.params.service);
        const serviceMap = serviceSlug ? SERVICE_MEDFLEX_MAP[serviceSlug] : null;
        const lpuId =
          serviceMap?.lpu_id ?? CLINIC.branches[0]?.medflex_lpu_id ?? MEDFLEX_DEFAULTS.lpu_id;

        booking = await createAppointment({
          fullName: intent.params.name,
          phone: intent.params.phone,
          preferredTime: intent.params.preferredTime,
          service: intent.params.service || '',
          doctorId: serviceMap?.doctor_id ?? MEDFLEX_DEFAULTS.doctor_id,
          lpuId,
          specialityId: serviceMap?.speciality_id ?? MEDFLEX_DEFAULTS.speciality_id,
          price: serviceMap?.price ?? MEDFLEX_DEFAULTS.price,
        });
      } catch (err) {
        bookingError = err.message;
        console.error('[Chat] createAppointment failed:', err.message);
      }
    }

    const updatedHistory = [
      ...history,
      { role: 'user', content: trimmedMessage },
      { role: 'assistant', content: reply },
    ];
    await saveHistory(sessionId, updatedHistory);

    await logMessage({
      sessionId,
      role: 'assistant',
      content: reply,
      page: pageContext,
      intentType: intent?.type,
      booking,
    });

    const responseBody = { reply };

    if (!booking && intent?.type === 'book_appointment' && intent?.ready) {
      const simulateBooking = process.env.MEDFLEX_SIMULATE_BOOKING === 'true';
      const isBalanceProblem = /\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u0441\u0440\u0435\u0434\u0441\u0442\u0432/i.test(
        bookingError || ''
      );

      if (simulateBooking && isBalanceProblem) {
        booking = buildSimulatedBooking(intent.params?.preferredTime);
        responseBody.reply =
          `${reply}\n\n` +
          `\u0422\u0435\u0441\u0442\u043e\u0432\u044b\u0439 \u0440\u0435\u0436\u0438\u043c: ` +
          `\u0437\u0430\u043f\u0438\u0441\u044c \u0441\u044b\u043c\u0438\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0430.`;
        responseBody.booking = booking;
        responseBody.bookingSimulated = true;
      } else if (bookingError) {
        responseBody.reply =
          `${reply}\n\n` +
          `\u0421\u0435\u0439\u0447\u0430\u0441 \u043d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c ` +
          `\u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438 ` +
          `\u043e\u0444\u043e\u0440\u043c\u0438\u0442\u044c \u0437\u0430\u043f\u0438\u0441\u044c.`;
        responseBody.bookingError = 'medflex_unavailable';
      }
    } else if (booking) {
      responseBody.booking = booking;
    }

    return res.json(responseBody);
  } catch (err) {
    console.error('[Chat] unhandled error:', err.message);
    return res.status(500).json({
      error:
        '\u041f\u0440\u043e\u0438\u0437\u043e\u0448\u043b\u0430 \u043e\u0448\u0438\u0431\u043a\u0430. ' +
        '\u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0435 \u0440\u0430\u0437.',
    });
  }
});

async function handleAvailabilityRequest({ history, trimmedMessage, sessionId, pageContext, res, query }) {
  try {
    const lpuId = CLINIC.branches[0]?.medflex_lpu_id ?? MEDFLEX_DEFAULTS.lpu_id;
    const availability =
      query.requestedDoctors.length > 0 && query.doctorIds.length === 0
        ? {
            onlineDoctors: [],
            offlineDoctors: query.requestedDoctors.map((d) => ({ name: d.name, role: d.role })),
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
    const deterministicReply = buildAvailabilityReply(query, availability);

    const updatedHistory = [
      ...history,
      { role: 'user', content: trimmedMessage },
      { role: 'assistant', content: deterministicReply },
    ];
    await saveHistory(sessionId, updatedHistory);

    await logMessage({
      sessionId,
      role: 'user',
      content: trimmedMessage,
      page: pageContext,
    });
    await logMessage({
      sessionId,
      role: 'assistant',
      content: deterministicReply,
      page: pageContext,
      intentType: 'ask_info',
    });

    return res.json({
      reply: deterministicReply,
      availability,
    });
  } catch (err) {
    console.error('[Chat] availability failed:', err.message);
    return res.json({
      reply:
        '\u0421\u0435\u0439\u0447\u0430\u0441 \u043d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c ' +
        '\u0440\u0430\u0441\u043f\u0438\u0441\u0430\u043d\u0438\u0435. \u042f \u043f\u0435\u0440\u0435\u0434\u0430\u043b\u0430 ' +
        '\u0437\u0430\u044f\u0432\u043a\u0443 \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440\u0443, ' +
        '\u0438 \u043c\u044b \u0441\u0432\u044f\u0436\u0435\u043c\u0441\u044f \u0441 \u0432\u0430\u043c\u0438.',
    });
  }
}

function hasBookingParams(intent) {
  return Boolean(intent?.params?.name && intent?.params?.phone && intent?.params?.preferredTime);
}

function slugFromServiceName(serviceName = '') {
  if (!serviceName) return null;
  const lower = serviceName.toLowerCase();
  const map = {
    '\u0438\u043c\u043f\u043b\u0430\u043d\u0442': 'implantation',
    '\u0432\u0438\u043d\u0438\u0440': 'veneers',
    '\u0431\u0440\u0435\u043a\u0435\u0442': 'braces',
    '\u044d\u043b\u0430\u0439\u043d\u0435\u0440': 'braces',
    '\u0433\u0438\u0433\u0438\u0435\u043d': 'hygiene',
    '\u0447\u0438\u0441\u0442\u043a': 'hygiene',
    '\u043b\u0435\u0447\u0435\u043d\u0438': 'treatment',
    '\u043a\u0430\u0440\u0438\u0435\u0441': 'treatment',
    '\u043e\u0442\u0431\u0435\u043b\u0438\u0432': 'whitening',
    '\u0434\u0435\u0442': 'pediatric',
    '\u0440\u0435\u0431\u0451\u043d\u043e\u043a': 'pediatric',
    '\u0434\u0438\u0430\u0433\u043d\u043e\u0441\u0442': 'diagnostics',
    '\u0441\u043d\u0438\u043c\u043e\u043a': 'diagnostics',
    '\u043f\u0440\u043e\u0442\u0435\u0437': 'prosthetics',
    '\u043a\u043e\u0440\u043e\u043d\u043a': 'prosthetics',
  };
  for (const [key, slug] of Object.entries(map)) {
    if (lower.includes(key)) return slug;
  }
  return null;
}

function normalizeIntent(intent) {
  if (!intent || typeof intent !== 'object') return null;
  const params = intent.params ?? {};
  return {
    type: intent.type || 'ask_info',
    ready: Boolean(intent.ready === true || (params.name && params.phone && params.preferredTime)),
    params: {
      name: params.name || '',
      phone: params.phone || '',
      preferredTime: params.preferredTime || '',
      doctorSpecialty: params.doctorSpecialty || '',
      service: params.service || '',
    },
  };
}

function inferBookingIntentFromText(text = '') {
  const lower = text.toLowerCase();
  const phoneMatch = text.match(/(?:\+7|8)[\d\s\-()]{10,}/);
  if (!phoneMatch) return null;

  let preferredTime = '';
  if (/morning|\u0443\u0442\u0440/i.test(lower)) preferredTime = '\u0443\u0442\u0440\u043e\u043c';
  if (/afternoon|\u0434\u043d/i.test(lower)) preferredTime = '\u0434\u043d\u0435\u043c';
  if (/evening|\u0432\u0435\u0447\u0435\u0440/i.test(lower)) preferredTime = '\u0432\u0435\u0447\u0435\u0440\u043e\u043c';
  if (!preferredTime) preferredTime = '\u0431\u043b\u0438\u0436\u0430\u0439\u0448\u0435\u0435 \u0432\u0440\u0435\u043c\u044f';

  return {
    type: 'book_appointment',
    ready: false,
    params: {
      name: '',
      phone: phoneMatch[0].trim(),
      preferredTime,
      doctorSpecialty: '',
      service: '',
    },
  };
}

function buildSimulatedBooking(preferredTime = '') {
  const now = new Date();
  const slotDate = new Date(now);
  if (/poslezavtra|\u043f\u043e\u0441\u043b\u0435\u0437\u0430\u0432\u0442\u0440\u0430/i.test(preferredTime)) {
    slotDate.setDate(slotDate.getDate() + 2);
  } else {
    slotDate.setDate(slotDate.getDate() + 1);
  }

  let hhmm = '12:00';
  if (/morning|\u0443\u0442\u0440/i.test(preferredTime)) hhmm = '10:00';
  if (/evening|\u0432\u0435\u0447\u0435\u0440/i.test(preferredTime)) hhmm = '18:00';

  return {
    date: slotDate.toISOString().slice(0, 10),
    time: hhmm,
    doctor:
      '\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440 ' +
      '\u043f\u043e\u0434\u0431\u0435\u0440\u0435\u0442 \u0432\u0440\u0430\u0447\u0430',
    confirmationCode: `SIM-${Date.now().toString().slice(-6)}`,
  };
}

function wantsAvailability(text = '') {
  const lower = text.toLowerCase();
  return (
    /(doctor|doctors|schedule|slot|slots|available|availability)/i.test(lower) ||
    /(\u0432\u0440\u0430\u0447|\u0434\u043e\u043a\u0442\u043e\u0440|\u0440\u0430\u0441\u043f\u0438\u0441|\u0441\u043b\u043e\u0442|\u043e\u043a\u043d|\u0441\u0432\u043e\u0431\u043e\u0434\u043d|\u0434\u043e\u0441\u0442\u0443\u043f\u043d)/i.test(
      lower
    )
  );
}

function parseAvailabilityQuery(message = '') {
  const lower = normalizeRu(message);
  const words = lower.split(/\s+/).filter(Boolean);
  const doctorIds = [];
  const requestedDoctors = [];

  for (const doctor of DOCTOR_CATALOG) {
    const tokens = doctor.name
      .toLowerCase()
      .split(/\s+/)
      .filter((x) => x.length >= 4);
    const tokenStems = tokens.map((token) => normalizeRu(token).slice(0, 5));
    const matched = tokenStems.some((stem) => words.some((w) => normalizeRu(w).startsWith(stem)));
    if (!matched) continue;

    requestedDoctors.push({ name: doctor.name, role: doctor.role });
    if (Number.isInteger(doctor.medflex_doctor_id)) {
      doctorIds.push(doctor.medflex_doctor_id);
    }
  }

  const dateIso = extractDateIso(message, lower);

  return { doctorIds, dateIso, requestedDoctors };
}

function buildAvailabilityReply(query, availability) {
  const hasDoctor = query.requestedDoctors.length > 0;
  const hasDate = Boolean(query.dateIso);

  if (availability.onlineDoctors.length === 0) {
    if (hasDoctor && hasDate) {
      return '\u041d\u0430 \u044d\u0442\u0443 \u0434\u0430\u0442\u0443 \u0443 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u043e\u0433\u043e \u0432\u0440\u0430\u0447\u0430 \u043d\u0435\u0442 \u043e\u043d\u043b\u0430\u0439\u043d-\u043e\u043a\u043e\u043d. \u041c\u043e\u0433\u0443 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0438\u0442\u044c \u0431\u043b\u0438\u0436\u0430\u0439\u0448\u0438\u0435.';
    }
    if (hasDoctor) {
      return '\u0423 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u043e\u0433\u043e \u0432\u0440\u0430\u0447\u0430 \u0441\u0435\u0439\u0447\u0430\u0441 \u043d\u0435\u0442 \u043e\u043d\u043b\u0430\u0439\u043d-\u043e\u043a\u043e\u043d \u0432 Medflex. \u041c\u043e\u0433\u0443 \u043f\u0435\u0440\u0435\u0434\u0430\u0442\u044c \u0437\u0430\u044f\u0432\u043a\u0443 \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440\u0443.';
    }
    return '\u0421\u0435\u0439\u0447\u0430\u0441 \u043d\u0435\u0442 \u043e\u043d\u043b\u0430\u0439\u043d-\u043e\u043a\u043e\u043d \u043f\u043e \u0437\u0430\u043f\u0440\u043e\u0441\u0443. \u041c\u043e\u0433\u0443 \u043f\u043e\u0434\u043e\u0431\u0440\u0430\u0442\u044c \u0431\u043b\u0438\u0436\u0430\u0439\u0448\u0438\u0435.';
  }

  if (hasDoctor && hasDate) {
    return '\u041f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u044e \u0432\u0441\u0435 \u043e\u043a\u043d\u0430 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u043e\u0433\u043e \u0432\u0440\u0430\u0447\u0430 \u043d\u0430 \u044d\u0442\u0443 \u0434\u0430\u0442\u0443.';
  }
  if (hasDoctor) {
    return '\u041f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u044e \u0431\u043b\u0438\u0436\u0430\u0439\u0448\u0438\u0435 \u043e\u043a\u043d\u0430 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u043e\u0433\u043e \u0432\u0440\u0430\u0447\u0430.';
  }
  if (hasDate) {
    return '\u041f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u044e \u043e\u043a\u043d\u0430 \u043d\u0430 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u0443\u044e \u0434\u0430\u0442\u0443.';
  }
  return '\u041d\u0430\u0448\u043b\u0430 \u0430\u043a\u0442\u0443\u0430\u043b\u044c\u043d\u044b\u0435 \u043e\u043a\u043d\u0430 \u043f\u043e \u0432\u0440\u0430\u0447\u0430\u043c. \u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0441\u0442\u0430, \u0438 \u044f \u0437\u0430\u043f\u0438\u0448\u0443 \u0432\u0430\u0441 \u043d\u0430 \u0443\u0434\u043e\u0431\u043d\u043e\u0435 \u0432\u0440\u0435\u043c\u044f.';
}

function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function extractDateIso(message = '', lowerNormalized = '') {
  const now = new Date();
  const currentYear = now.getFullYear();

  const numericDmy = String(message).match(/\b(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\b/);
  if (numericDmy) {
    const dd = numericDmy[1].padStart(2, '0');
    const mm = numericDmy[2].padStart(2, '0');
    const yearRaw = numericDmy[3];
    let yyyy = String(currentYear);
    if (yearRaw) yyyy = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
    return `${yyyy}-${mm}-${dd}`;
  }

  if (/\u043f\u043e\u0441\u043b\u0435\u0437\u0430\u0432\u0442\u0440\u0430/i.test(lowerNormalized)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    return toIsoDate(d);
  }
  if (/\u0441\u0435\u0433\u043e\u0434\u043d\u044f/i.test(lowerNormalized)) {
    return toIsoDate(now);
  }
  if (/\u0437\u0430\u0432\u0442\u0440\u0430/i.test(lowerNormalized)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return toIsoDate(d);
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

  const dd = String(day).padStart(2, '0');
  const mm = String(monthNumber).padStart(2, '0');
  return `${currentYear}-${mm}-${dd}`;
}

function monthFromToken(token = '') {
  const monthMap = [
    ['\u044f\u043d\u0432', 1],
    ['\u0444\u0435\u0432', 2],
    ['\u043c\u0430\u0440', 3],
    ['\u0430\u043f\u0440', 4],
    ['\u043c\u0430\u0439', 5],
    ['\u043c\u0430\u044f', 5],
    ['\u0438\u044e\u043d', 6],
    ['\u0438\u044e\u043b', 7],
    ['\u0430\u0432\u0433', 8],
    ['\u0441\u0435\u043d', 9],
    ['\u043e\u043a\u0442', 10],
    ['\u043d\u043e\u044f', 11],
    ['\u0434\u0435\u043a', 12],
  ];

  for (const [prefix, month] of monthMap) {
    if (token.startsWith(prefix)) return month;
  }
  return 0;
}

function normalizeRu(input = '') {
  return String(input)
    .toLowerCase()
    .replace(/\u0451/g, '\u0435')
    .replace(/[^a-z\u0430-\u044f0-9\s.-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default router;


