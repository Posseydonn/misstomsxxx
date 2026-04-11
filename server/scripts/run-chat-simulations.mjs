import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const BUG_FILE = path.join(ROOT_DIR, 'bug.md');

const originalFetch = globalThis.fetch?.bind(globalThis);
const bookedSlots = new Set();
let claimCounter = 1;

const names = [
  'Алина', 'Борис', 'Вера', 'Глеб', 'Дарья', 'Егор', 'Жанна', 'Захар', 'Инна', 'Кирилл',
  'Лилия', 'Максим', 'Нина', 'Олег', 'Полина', 'Роман', 'Светлана', 'Тимур', 'Ульяна', 'Фёдор',
  'Хадижа', 'Цезарь', 'Чулпан', 'Шамиль', 'Элина', 'Юрий', 'Яна', 'Артём', 'Белла', 'Владимир',
  'Галина', 'Денис', 'Ева', 'Зоя', 'Илья', 'Карина', 'Лев', 'Марина', 'Назар', 'Оксана',
  'Павел', 'Руслан', 'София', 'Таисия', 'Умар', 'Фаина', 'Хасан', 'Эмма', 'Юлия', 'Ярослав',
];

const initialMessages = [
  'У меня ноет нижний зуб уже второй день, хочу записаться.',
  'Ночью разболелся жевательный зуб, помогите попасть к врачу.',
  'Болит верхний зуб, хочу прийти как можно скорее.',
  'Зуб реагирует на холодное и ноет, нужна запись.',
  'Стал сильно ныть дальний зуб, хочу на прием.',
  'Боль в зубе держится со вчера, запишите меня.',
  'У меня дергает зуб, хочу подобрать время.',
  'Разболелся передний зуб, нужно лечение и запись.',
  'Есть боль в зубе при жевании, хочу прийти.',
  'Уже два дня болит зуб, подберите прием.',
  'Нет одного зуба, хочу понять как восстановить и записаться.',
  'Недавно удалили зуб, хочу консультацию по импланту.',
  'У меня отсутствует зуб, хочу записаться на консультацию.',
  'Хочу восстановить удаленный зуб, помогите записаться.',
  'После удаления зуба думаю об импланте, хочу прийти.',
  'Нет жевательного зуба, нужен прием по восстановлению.',
  'Без одного зуба неудобно жевать, хочу консультацию.',
  'Хочу закрыть пустое место после удаления зуба.',
  'Давно нет одного зуба, подберите прием по импланту.',
  'Потерял зуб и хочу понять насчет имплантации.',
  'Хочу поставить имплант и записаться на консультацию.',
  'Интересует имплантация, помогите выбрать время.',
  'Планирую имплант, хочу записаться на прием.',
  'Смотрю в сторону имплантации, хочу консультацию.',
  'Хочу обсудить установку импланта и записаться.',
  'Нужна консультация по импланту, подберите окно.',
  'Хочу узнать про имплант и сразу записаться.',
  'Пора ставить имплант, хочу подобрать время.',
  'Мне нужна запись на консультацию по имплантации.',
  'Хочу прийти поговорить про имплантацию.',
  'Нужна коронка на передний зуб, хочу записаться.',
  'Хочу консультацию по коронке и запись на прием.',
  'Планирую протезирование, помогите подобрать время.',
  'Интересует коронка на зуб, хочу прийти.',
  'Хочу записаться к ортопеду по коронке.',
  'Нужно протезирование, подберите ближайший прием.',
  'Хочу обсудить коронку и сразу записаться.',
  'Интересует протезирование зуба, нужна консультация.',
  'Хочу поставить коронку, помогите выбрать время.',
  'Нужна запись по протезированию, когда можно прийти?',
  'Сколько стоит имплантация?',
  'Какая цена на имплант, а потом хочу записаться.',
  'Подскажите стоимость имплантации и запись.',
  'Хочу узнать цену импланта, потом выбрать время.',
  'Сколько у вас стоит коронка и можно записаться?',
  'Подскажите цену коронки, если подойдет, запишусь.',
  'Сколько стоит лечение зуба, а потом нужен прием.',
  'Хочу сначала понять цену лечения, потом записаться.',
  'Сориентируйте по стоимости протезирования и записи.',
  'Какая цена на лечение кариеса, и можно сразу выбрать время?',
];

const followups = [
  'Давайте.', 'Хорошо, показывайте.', 'Покажите, пожалуйста.', 'Можно посмотреть окна.', 'Да, подберите время.',
  'Ок, хочу посмотреть слоты.', 'Тогда покажите ближайшие.', 'Да, давайте дальше.', 'Мне подходит, показывайте.', 'Можно ближайшее окно.',
  'Хорошо, покажите варианты.', 'Да, хочу увидеть время.', 'Тогда подберите запись.', 'Покажите, что есть.', 'Давайте выберем окно.',
  'Можно посмотреть расписание.', 'Да, покажите приемы.', 'Хорошо, мне нужны окна.', 'Подберите ближайшее время.', 'Давайте смотреть свободное.',
  'Да, хочу записаться.', 'Хорошо, дайте ближайшие окна.', 'Покажите свободные слоты.', 'Можно ближайшие приемы.', 'Давайте подберем время.',
  'Хорошо, покажите расписание.', 'Да, покажите ближайшее.', 'Можно окна на прием.', 'Тогда покажите слоты.', 'Да, давайте окна.',
  'Покажите время, пожалуйста.', 'Хорошо, хочу выбрать слот.', 'Можно запись на ближайшее.', 'Да, покажите доступное время.', 'Подберите окно, пожалуйста.',
  'Давайте посмотрим расписание.', 'Покажите варианты записи.', 'Можно выбрать время?', 'Да, хочу увидеть окна.', 'Хорошо, ведите дальше.',
  'Тогда покажите ближайшие окна.', 'Да, после цены хочу запись.', 'Подойдет, показывайте время.', 'Хорошо, давайте к слотам.', 'Покажите окно для записи.',
  'Можно сразу расписание.', 'Тогда хочу выбрать время.', 'Да, покажите что свободно.', 'Хорошо, покажите доступные окна.', 'Можно перейти к записи.',
];

const bookingNudges = [
  'Тогда запишите меня на прием.', 'Хочу перейти к записи.', 'Давайте оформим запись.', 'Подберите мне прием.', 'Нужна запись на консультацию.',
  'Хочу выбрать время приема.', 'Тогда помогите записаться.', 'Мне нужна запись.', 'Подберите окно для визита.', 'Хочу выбрать дату приема.',
  'Нужен ближайший прием.', 'Давайте к записи.', 'Хочу прийти на консультацию.', 'Выберите мне время.', 'Оформим запись.',
  'Давайте искать окно.', 'Хочу попасть на прием.', 'Нужна консультация в ближайшее время.', 'Можно записаться сейчас?', 'Хочу подобрать слот.',
  'Мне нужен визит.', 'Давайте найдем время.', 'Подберите запись на этой неделе.', 'Хочу оформить визит.', 'Можно выбрать ближайший слот.',
  'Подберите мне консультацию.', 'Хочу взять время.', 'Перейдем к записи.', 'Запишите меня в ближайшие дни.', 'Нужна свободная дата.',
  'Хочу записаться через чат.', 'Подберите прием, пожалуйста.', 'Можно сразу записать?', 'Нужен ближайший визит.', 'Давайте выбирать прием.',
  'Хочу время к врачу.', 'Можно оформить консультацию?', 'Мне нужен слот на прием.', 'Пора записаться.', 'Хочу забронировать окно.',
  'Нужен прием по этой теме.', 'Давайте запишемся.', 'Хочу подобрать ближайшее время.', 'Мне нужен визит на консультацию.', 'Подберите слот для записи.',
  'Хочу оформить прием сейчас.', 'Давайте искать ближайшее окно.', 'Мне подходит запись через чат.', 'Нужен удобный слот.', 'Можно сразу оформить прием?',
];

const slotPhrases = [
  'Беру это время.', 'Это окно мне подходит.', 'Выбираю этот слот.', 'Остановимся на этом времени.', 'Запишите на этот вариант.',
  'Мне удобно это окно.', 'Подходит этот прием.', 'Беру этот слот.', 'Пусть будет это время.', 'Мне подходит этот вариант.',
  'Выбираю это время.', 'Записывайте на этот слот.', 'Хочу это окно.', 'Подойдет этот прием.', 'Берем это время.',
  'Мне удобно сюда.', 'Этот слот хороший.', 'Пусть будет этот вариант.', 'Подтверждаю это окно.', 'Берем этот слот.',
  'Оставляем это время.', 'Хочу именно этот слот.', 'Мне подходит сюда.', 'Выбираю этот прием.', 'Подходит этот слот.',
  'Запишите на это окно.', 'Беру ближайший слот.', 'Ок, это время подходит.', 'Мне удобно так.', 'Оставим этот прием.',
  'Этот вариант хороший.', 'Да, выберу это окно.', 'Мне подходит такой слот.', 'Запишите сюда.', 'Останавливаюсь на этом времени.',
  'Пойдет это окно.', 'Хочу этот прием.', 'Пусть будет сюда.', 'Выбираю ближайшее окно.', 'Мне подходит этот прием.',
  'Ок, беру этот слот.', 'Запишите на этот вариант времени.', 'Оставим этот слот.', 'Этот прием мне удобен.', 'Подходит ближайшее окно.',
  'Давайте это время.', 'Берем ближайший вариант.', 'Выбираю этот вариант.', 'Мне подойдет этот слот.', 'Запишите в это окно.',
];

function cleanGeneratedMessage(text) {
  return String(text).replace(/[.!?]+$/u, '').trim();
}

function createMockResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function createScheduleRows() {
  const doctors = [
    { doctorId: 981249, specialityId: 305, times: ['10:00', '12:30', '16:00'] },
    { doctorId: 1348226, specialityId: 49, times: ['11:00', '14:00', '17:00'] },
    { doctorId: 1348227, specialityId: 47, times: ['09:30', '13:30', '18:00'] },
  ];

  const rows = [];
  const baseDate = new Date('2026-04-11T09:00:00');

  for (const doctor of doctors) {
    const cells = [];
    for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
      const current = new Date(baseDate);
      current.setDate(baseDate.getDate() + dayOffset);
      const dateIso = current.toISOString().slice(0, 10);

      for (const time of doctor.times) {
        const key = `${doctor.doctorId}|${dateIso}|${time}`;
        if (bookedSlots.has(key)) continue;
        cells.push({
          dt_start: `${dateIso} ${time}:00`,
          dt_end: `${dateIso} ${addMinutes(time, 30)}:00`,
        });
      }
    }

    rows.push({
      doctor_id: doctor.doctorId,
      lpu_id: 103758,
      specialities: [doctor.specialityId],
      cells,
    });
  }

  return rows;
}

function addMinutes(time, minutesToAdd) {
  const [hours, minutes] = time.split(':').map(Number);
  const total = hours * 60 + minutes + minutesToAdd;
  const nextHours = String(Math.floor(total / 60)).padStart(2, '0');
  const nextMinutes = String(total % 60).padStart(2, '0');
  return `${nextHours}:${nextMinutes}`;
}

globalThis.fetch = async (url, options = {}) => {
  const href = String(url);

  if (href.startsWith('https://api.medflex.ru')) {
    const method = (options.method || 'GET').toUpperCase();
    const parsedUrl = new URL(href);

    if (parsedUrl.pathname === '/schedule/' && method === 'GET') {
      const rows = createScheduleRows();
      return createMockResponse(200, { data: rows });
    }

    if (parsedUrl.pathname === '/direct_appointment/doctor/execute/' && method === 'POST') {
      const body = JSON.parse(String(options.body || '{}'));
      const doctorId = body?.doctor?.id;
      const dtStart = String(body?.appointment?.dt_start || '');
      const [dateIso, timeWithSeconds] = dtStart.split(' ');
      const time = timeWithSeconds?.slice(0, 5) || '';
      const key = `${doctorId}|${dateIso}|${time}`;

      if (bookedSlots.has(key)) {
        return createMockResponse(400, { detail: 'slot already taken' });
      }

      bookedSlots.add(key);
      const claimId = `SIM-${String(claimCounter).padStart(6, '0')}`;
      claimCounter += 1;
      return createMockResponse(200, { claim_id: claimId });
    }

    if (parsedUrl.pathname === '/direct_appointment/doctor/cancel/' && method === 'POST') {
      return createMockResponse(200, { ok: true });
    }
  }

  return originalFetch(url, options);
};

function makeScenarios() {
  return initialMessages.map((initialMessage, index) => ({
    id: index + 1,
    sessionId: `sim-${String(index + 1).padStart(2, '0')}-${Date.now()}`,
    initialMessage,
    followup: cleanGeneratedMessage(followups[index]),
    bookingNudge: cleanGeneratedMessage(bookingNudges[index]),
    slotPhrase: cleanGeneratedMessage(slotPhrases[index]),
    contactName: names[index],
    phone: `+7 (999) ${String(100 + index).slice(-3)}-${String(10 + (index % 90)).padStart(2, '0')}-${String(20 + (index % 70)).padStart(2, '0')}`,
  }));
}

async function bootApp() {
  const { default: chatRouter } = await import('../routes/chat.js');
  const app = express();
  app.use(express.json());
  app.use('/api/chat', chatRouter);

  return await new Promise((resolve) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${port}/api/chat`,
      });
    });
  });
}

async function sendTurn(baseUrl, sessionId, body, transcript) {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      ...body,
    }),
  });

  const data = await res.json();
  transcript.push({ role: 'user', content: body.message || '[clientAction]', clientAction: body.clientAction || null });
  transcript.push({
    role: 'assistant',
    action: data.action,
    reply: data.reply,
    state: data.state,
    hasAvailability: Boolean(data.availability),
    hasBookingForm: Boolean(data.bookingForm),
    hasBooking: Boolean(data.booking),
    fallbackReason: data.fallbackReason || '',
  });
  return data;
}

function pickFirstSlot(availability) {
  const doctor = availability?.onlineDoctors?.find((item) => Array.isArray(item.slots) && item.slots.length > 0);
  if (!doctor) return null;
  const slot = doctor.slots[0];
  const [date, time] = slot.split(' ');
  return {
    doctorName: doctor.name,
    date,
    time,
  };
}

function displayDateToIso(value) {
  const [day, month, year] = String(value || '').split('.');
  if (!(day && month && year)) return '';
  return `${year}-${month}-${day}`;
}

function analyzeScenario(scenario, transcript, finalResponse) {
  const issues = [];
  const assistantTurns = transcript.filter((item) => item.role === 'assistant');
  const genericReplies = assistantTurns.filter((item) =>
    /напишите, что нужно: лечение, имплантация, цена или отмена визита/i.test(item.reply || '')
  );
  const reachedAvailability = assistantTurns.some((item) => item.action === 'show_availability');
  const reachedBookingForm = assistantTurns.some((item) => item.action === 'show_booking_form');
  const reachedBookingAttempt = assistantTurns.some((item) => item.action === 'confirm_booking' || item.action === 'handoff');

  if (genericReplies.length > 0) {
    issues.push('Бот уходил в слишком общий fallback вместо точного ведения сценария.');
  }
  if (!reachedAvailability) {
    issues.push('Диалог не дошёл до показа свободных окон.');
  }
  if (!reachedBookingForm) {
    issues.push('Диалог не дошёл до формы контактов.');
  }
  if (!reachedBookingAttempt) {
    issues.push('Сценарий не дошёл до попытки оформления записи.');
  }
  if (assistantTurns.length > 4) {
    issues.push('Перед записью оказалось слишком много шагов.');
  }
  if (finalResponse?.action === 'handoff') {
    issues.push('Автоматическая запись не завершилась подтверждением, сценарий ушёл в handoff.');
  }
  if (finalResponse?.action !== 'confirm_booking' && finalResponse?.action !== 'handoff') {
    issues.push(`Финальное действие оказалось неожиданным: ${finalResponse?.action || 'none'}.`);
  }

  return issues;
}

function renderTranscript(transcript) {
  return transcript
    .map((turn) => {
      if (turn.role === 'user') {
        return `- Пользователь: ${turn.content}`;
      }
      return `- Бот [${turn.action}]: ${turn.reply}`;
    })
    .join('\n');
}

async function runScenario(baseUrl, scenario) {
  const transcript = [];
  let response = await sendTurn(
    baseUrl,
    scenario.sessionId,
    { message: scenario.initialMessage },
    transcript
  );

  let followupSent = false;
  let nudgeSent = false;
  let slotPicked = false;
  let contactsSent = false;

  for (let step = 0; step < 8; step += 1) {
    if (response.action === 'show_availability') {
      const slot = pickFirstSlot(response.availability);
      if (!slot) break;
      slotPicked = true;
      response = await sendTurn(
        baseUrl,
        scenario.sessionId,
        {
          message: scenario.slotPhrase,
          clientAction: {
            type: 'slot_pick',
            params: {
              doctorName: slot.doctorName,
              date: slot.date,
              dateIso: displayDateToIso(slot.date),
              time: slot.time,
            },
          },
        },
        transcript
      );
      continue;
    }

    if (response.action === 'show_booking_form') {
      contactsSent = true;
      response = await sendTurn(
        baseUrl,
        scenario.sessionId,
        {
          message: `Меня зовут ${scenario.contactName}, оставляю номер для подтверждения.`,
          clientAction: {
            type: 'booking_form_submit',
            params: {
              name: scenario.contactName,
              phone: scenario.phone,
            },
          },
        },
        transcript
      );
      continue;
    }

    if (response.action === 'confirm_booking' || response.action === 'handoff') {
      break;
    }

    if (
      response.action === 'recommend_specialist' ||
      (response.action === 'ask_followup' && response.state?.pendingPrompt?.nextStep === 'show_availability')
    ) {
      followupSent = true;
      response = await sendTurn(
        baseUrl,
        scenario.sessionId,
        { message: scenario.followup },
        transcript
      );
      continue;
    }

    if (response.action === 'ask_followup' && !nudgeSent) {
      nudgeSent = true;
      response = await sendTurn(
        baseUrl,
        scenario.sessionId,
        { message: scenario.bookingNudge },
        transcript
      );
      continue;
    }

    break;
  }

  const issues = analyzeScenario(scenario, transcript, response);
  return {
    scenario,
    transcript,
    issues,
    finalAction: response?.action || 'none',
    finalReply: response?.reply || '',
    slotPicked,
    contactsSent,
    bookingConfirmed: response?.action === 'confirm_booking',
  };
}

function buildReport(results) {
  const confirmed = results.filter((item) => item.bookingConfirmed).length;
  const handoffs = results.filter((item) => item.finalAction === 'handoff').length;
  const withIssues = results.filter((item) => item.issues.length > 0).length;

  const parts = [
    '# Chat Simulation Bugs',
    '',
    `- Прогонов: ${results.length}`,
    `- Подтвержденных записей: ${confirmed}`,
    `- Handoff вместо подтверждения: ${handoffs}`,
    `- Прогонов с замечаниями: ${withIssues}`,
    '',
  ];

  for (const result of results) {
    parts.push(`## Тест ${String(result.scenario.id).padStart(2, '0')}`);
    parts.push(`- Стартовое сообщение: ${result.scenario.initialMessage}`);
    parts.push(`- Итог: ${result.finalAction}`);
    parts.push(`- Слот выбран: ${result.slotPicked ? 'да' : 'нет'}`);
    parts.push(`- Контакты отправлены: ${result.contactsSent ? 'да' : 'нет'}`);
    parts.push('- Диалог:');
    parts.push(renderTranscript(result.transcript));
    parts.push('- Анализ:');

    if (result.issues.length === 0) {
      parts.push('- Существенных проблем в этом прогоне не заметил.');
    } else {
      for (const issue of result.issues) {
        parts.push(`- ${issue}`);
      }
    }

    parts.push('');
  }

  return parts.join('\n');
}

async function main() {
  const { server, baseUrl } = await bootApp();

  try {
    const scenarios = makeScenarios();
    const results = [];

    for (const scenario of scenarios) {
      const result = await runScenario(baseUrl, scenario);
      results.push(result);
      console.log(
        `[${String(scenario.id).padStart(2, '0')}] ${result.finalAction} | issues: ${result.issues.length}`
      );
    }

    const report = buildReport(results);
    await fs.writeFile(BUG_FILE, report, 'utf8');

    console.log(`Saved report to ${BUG_FILE}`);
  } finally {
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    await new Promise((resolve) => server.close(resolve));
    process.exit(0);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
