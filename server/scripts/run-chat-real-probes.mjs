import express from 'express';

const originalFetch = globalThis.fetch?.bind(globalThis);
const bookedSlots = new Set();
let claimCounter = 1;

function createMockResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function addMinutes(time, minutesToAdd) {
  const [hours, minutes] = time.split(':').map(Number);
  const total = hours * 60 + minutes + minutesToAdd;
  const nextHours = String(Math.floor(total / 60)).padStart(2, '0');
  const nextMinutes = String(total % 60).padStart(2, '0');
  return `${nextHours}:${nextMinutes}`;
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
    for (let dayOffset = 0; dayOffset < 10; dayOffset += 1) {
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

globalThis.fetch = async (url, options = {}) => {
  const href = String(url);
  if (href.startsWith('https://api.medflex.ru')) {
    const method = (options.method || 'GET').toUpperCase();
    const parsedUrl = new URL(href);

    if (parsedUrl.pathname === '/schedule/' && method === 'GET') {
      return createMockResponse(200, { data: createScheduleRows() });
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
      const claimId = `REAL-${String(claimCounter).padStart(6, '0')}`;
      claimCounter += 1;
      return createMockResponse(200, { claim_id: claimId });
    }

    if (parsedUrl.pathname === '/direct_appointment/doctor/cancel/' && method === 'POST') {
      return createMockResponse(200, { ok: true });
    }
  }

  return originalFetch(url, options);
};

async function bootApp() {
  const { default: chatRouter } = await import('../routes/chat.js');
  const app = express();
  app.use(express.json());
  app.use('/api/chat', chatRouter);

  return await new Promise((resolve) => {
    const server = app.listen(0, () => {
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${server.address().port}/api/chat`,
      });
    });
  });
}

async function send(baseUrl, sessionId, body) {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, ...body }),
  });

  return await response.json();
}

function pickFirstSlot(availability) {
  const doctor =
    availability?.onlineDoctors?.find((item) => Array.isArray(item.slots) && item.slots.length > 0) ||
    availability?.offlineDoctors?.find((item) => Array.isArray(item.slots) && item.slots.length > 0);

  if (!doctor) return null;

  const slot = doctor.slots[0];
  const [date, time] = slot.split(' ');
  const [day, month, year] = date.split('.');

  return {
    doctorName: doctor.name,
    date,
    dateIso: `${year}-${month}-${day}`,
    time,
  };
}

async function runSimpleProbe(baseUrl, config) {
  const response = await send(baseUrl, config.sessionId, { message: config.message });
  return {
    name: config.name,
    ok: config.assert(response),
    finalAction: response.action,
    reply: response.reply,
    state: response.state,
  };
}

async function runBookingProbe(baseUrl, config) {
  const transcript = [];
  let response = await send(baseUrl, config.sessionId, { message: config.firstMessage });
  transcript.push(['user', config.firstMessage]);
  transcript.push(['assistant', response.action, response.reply]);

  if (config.afterFirst) {
    response = await send(baseUrl, config.sessionId, config.afterFirst);
    transcript.push(['user', config.afterFirst.message || '[action]']);
    transcript.push(['assistant', response.action, response.reply]);
  }

  if (
    response.action === 'recommend_specialist' ||
    (response.action === 'ask_followup' && response.state?.pendingPrompt?.nextStep === 'show_availability')
  ) {
    const confirmation = config.confirmation || 'давайте';
    response = await send(baseUrl, config.sessionId, { message: confirmation });
    transcript.push(['user', confirmation]);
    transcript.push(['assistant', response.action, response.reply]);
  }

  if (response.action === 'show_availability') {
    const slot = pickFirstSlot(response.availability);
    response = await send(baseUrl, config.sessionId, {
      message: config.slotPhrase || 'беру это время',
      clientAction: {
        type: 'slot_pick',
        params: slot,
      },
    });
    transcript.push(['user', config.slotPhrase || 'беру это время']);
    transcript.push(['assistant', response.action, response.reply]);
  }

  if (config.afterSlot) {
    response = await send(baseUrl, config.sessionId, config.afterSlot);
    transcript.push(['user', config.afterSlot.message || '[action]']);
    transcript.push(['assistant', response.action, response.reply]);
  }

  if (response.action === 'show_availability') {
    const slot = pickFirstSlot(response.availability);
    response = await send(baseUrl, config.sessionId, {
      message: config.secondSlotPhrase || 'тогда беру это окно',
      clientAction: {
        type: 'slot_pick',
        params: slot,
      },
    });
    transcript.push(['user', config.secondSlotPhrase || 'тогда беру это окно']);
    transcript.push(['assistant', response.action, response.reply]);
  }

  if (response.action === 'show_booking_form') {
    response = await send(baseUrl, config.sessionId, {
      message: 'меня зовут Тест, оставляю номер',
      clientAction: {
        type: 'booking_form_submit',
        params: {
          name: 'Тест',
          phone: '+7 (999) 555-44-33',
        },
      },
    });
    transcript.push(['user', 'меня зовут Тест, оставляю номер']);
    transcript.push(['assistant', response.action, response.reply]);
  }

  return {
    name: config.name,
    ok: config.assert(response, transcript),
    finalAction: response.action,
    reply: response.reply,
    transcript,
    state: response.state,
    booking: response.booking || null,
  };
}

async function runCancelProbe(baseUrl) {
  const booked = await runBookingProbe(baseUrl, {
    name: 'cancel_confirm_flow_booking_setup',
    sessionId: 'real-probe-09',
    firstMessage: 'болит зуб, хочу попасть к врачу',
    confirmation: 'покажите',
    assert: (response) => response.action === 'confirm_booking',
  });

  const claimId =
    booked.booking?.confirmationCode ||
    booked.booking?.claimId ||
    booked.state?.slots?.claimId ||
    '';

  const start = await send(baseUrl, 'real-probe-09', {
    message: `хочу отменить запись ${claimId}`,
  });
  const confirm = await send(baseUrl, 'real-probe-09', {
    message: 'да, отменяйте',
    clientAction: {
      type: 'cancellation_confirm',
      params: { claimId },
    },
  });

  return {
    name: 'cancel_confirm_flow',
    ok:
      (start.action === 'cancel_booking' || start.action === 'ask_followup') &&
      confirm.action === 'cancel_booking',
    finalAction: confirm.action,
    reply: confirm.reply,
    startAction: start.action,
  };
}

function printProbe(result) {
  const status = result.ok ? 'OK' : 'FAIL';
  console.log(`[${status}] ${result.name} -> ${result.finalAction}`);
  if (!result.ok) {
    console.log(`  reply: ${result.reply}`);
  }
}

async function main() {
  const { server, baseUrl } = await bootApp();

  try {
    const results = [];

    results.push(
      await runBookingProbe(baseUrl, {
        name: 'typo_pain_to_booking',
        sessionId: 'real-probe-01',
        firstMessage: 'у миня заболела 2 зуба 3 дня балит',
        confirmation: 'ну давайте тогда',
        assert: (response) => response.action === 'confirm_booking',
      })
    );

    results.push(
      await runSimpleProbe(baseUrl, {
        name: 'urgent_swelling_temp',
        sessionId: 'real-probe-02',
        message: 'у меня температура и распухла десна',
        assert: (response) =>
          response.action === 'handoff' && response.state?.stage === 'urgent_triage',
      })
    );

    results.push(
      await runSimpleProbe(baseUrl, {
        name: 'urgent_bleeding_swelling',
        sessionId: 'real-probe-03',
        message: 'после удаления кровь не останавливается и щека отекла',
        assert: (response) =>
          response.action === 'handoff' && response.state?.stage === 'urgent_triage',
      })
    );

    results.push(
      await runSimpleProbe(baseUrl, {
        name: 'mixed_price_booking',
        sessionId: 'real-probe-04',
        message: 'сколько стоит имплантация и можно записаться вечером?',
        assert: (response) => response.action === 'show_availability',
      })
    );

    {
      const first = await send(baseUrl, 'real-probe-05', {
        message: 'подскажите цену на коронку, если подойдет запишусь',
      });
      const second = await send(baseUrl, 'real-probe-05', {
        message: 'ок, показывайте',
      });
      results.push({
        name: 'price_then_short_confirmation',
        ok:
          first.action === 'show_availability' ||
          (first.state?.pendingPrompt?.nextStep === 'show_availability' &&
            second.action === 'show_availability'),
        finalAction: second.action,
        reply: second.reply,
        firstAction: first.action,
      });
    }

    results.push(
      await runBookingProbe(baseUrl, {
        name: 'change_doctor_mid_flow',
        sessionId: 'real-probe-06',
        firstMessage: 'хочу к имплантологу',
        confirmation: 'покажите окна',
        afterSlot: { message: 'не этот врач, давайте другого' },
        assert: (response) =>
          response.action === 'confirm_booking' && response.booking?.doctor !== 'Шовгенов Тембот Нальбиевич',
      })
    );

    results.push(
      await runBookingProbe(baseUrl, {
        name: 'change_date_after_slot',
        sessionId: 'real-probe-07',
        firstMessage: 'болит зуб, хочу записаться',
        confirmation: 'давайте',
        afterSlot: { message: 'другая дата нужна' },
        assert: (response, transcript) => {
          const bookingFormTurns = transcript.filter(
            (turn) => turn[0] === 'assistant' && turn[1] === 'show_booking_form'
          );
          if (bookingFormTurns.length < 2) return false;
          return response.action === 'confirm_booking' && bookingFormTurns[0][2] !== bookingFormTurns[1][2];
        },
      })
    );

    results.push(
      await runSimpleProbe(baseUrl, {
        name: 'consultation_info_without_forced_booking',
        sessionId: 'real-probe-08',
        message: 'имплант хочу, но пока просто понять этапы и сроки',
        assert: (response) =>
          response.action === 'ask_followup' || response.action === 'recommend_specialist',
      })
    );

    results.push(await runCancelProbe(baseUrl));

    results.push(
      await runSimpleProbe(baseUrl, {
        name: 'explicit_handoff',
        sessionId: 'real-probe-10',
        message: 'соедините с администратором',
        assert: (response) => response.action === 'handoff',
      })
    );

    results.push(
      await runSimpleProbe(baseUrl, {
        name: 'true_fallback_only',
        sessionId: 'real-probe-11',
        message: 'ываолвпав ывпава',
        assert: (response) => response.action === 'ask_followup',
      })
    );

    results.push(
      await runSimpleProbe(baseUrl, {
        name: 'pain_with_time_preference',
        sessionId: 'real-probe-12',
        message: 'болит десна и зуб мудрости, можно сегодня после работы?',
        assert: (response) =>
          response.action === 'recommend_specialist' || response.action === 'show_availability',
      })
    );

    for (const result of results) {
      printProbe(result);
    }

    const failed = results.filter((result) => !result.ok);
    console.log('');
    console.log(`Probes: ${results.length}`);
    console.log(`Failed: ${failed.length}`);
    if (failed.length > 0) {
      console.log('');
      console.log(JSON.stringify(failed, null, 2));
    }
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
  process.exit(1);
});
