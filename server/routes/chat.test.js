import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const store = {
  history: new Map(),
  state: new Map(),
};

const createAppointmentMock = vi.fn();
const cancelAppointmentMock = vi.fn();
const getAvailabilityDigestMock = vi.fn();
const gigaChatMock = vi.fn();
const logMessageMock = vi.fn();

const THERAPIST_DOCTOR = '\u041f\u043e\u0434\u043e\u043f\u0440\u0438\u0433\u043e\u0440\u0430 \u041e\u043a\u0441\u0430\u043d\u0430 \u0412\u0438\u043a\u0442\u043e\u0440\u043e\u0432\u043d\u0430';
const IMPLANT_DOCTOR = '\u0428\u043e\u0432\u0433\u0435\u043d\u043e\u0432 \u0422\u0435\u043c\u0431\u043e\u0442 \u041d\u0430\u043b\u044c\u0431\u0438\u0435\u0432\u0438\u0447';

vi.mock('../services/redis.js', () => ({
  getHistory: vi.fn(async (sessionId) => store.history.get(sessionId) ?? []),
  saveHistory: vi.fn(async (sessionId, history) => {
    store.history.set(sessionId, history);
  }),
  getConversationState: vi.fn(async (sessionId) => store.state.get(sessionId) ?? null),
  saveConversationState: vi.fn(async (sessionId, state) => {
    store.state.set(sessionId, state);
  }),
  clearConversationState: vi.fn(async (sessionId) => {
    store.state.delete(sessionId);
  }),
}));

vi.mock('../services/medflex.js', () => ({
  createAppointment: createAppointmentMock,
  cancelAppointment: cancelAppointmentMock,
  getAvailabilityDigest: getAvailabilityDigestMock,
  normalizePhone: (phone) => {
    const digits = String(phone).replace(/\D/g, '');
    if (digits.startsWith('8') && digits.length === 11) return `7${digits.slice(1)}`;
    if (digits.startsWith('7') && digits.length === 11) return digits;
    if (digits.length === 10) return `7${digits}`;
    return digits;
  },
}));

vi.mock('../services/gigachat.js', () => ({
  chat: gigaChatMock,
}));

vi.mock('../services/postgres.js', () => ({
  initDb: vi.fn(async () => true),
  logMessage: logMessageMock,
}));

describe('chat router', () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    store.history.clear();
    store.state.clear();
    createAppointmentMock.mockReset();
    cancelAppointmentMock.mockReset();
    getAvailabilityDigestMock.mockReset();
    gigaChatMock.mockReset();
    logMessageMock.mockReset();

    const { default: chatRouter } = await import('./chat.js');
    const app = express();
    app.use(express.json());
    app.use('/api/chat', chatRouter);
    server = app.listen(0);
    baseUrl = `http://127.0.0.1:${server.address().port}/api/chat`;
  });

  afterEach(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  async function post(body) {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return {
      res,
      data: await res.json(),
    };
  }

  it('returns deterministic availability without model', async () => {
    getAvailabilityDigestMock.mockResolvedValue({
      onlineDoctors: [
        {
          doctorId: 981249,
          name: THERAPIST_DOCTOR,
          role: '\u0422\u0435\u0440\u0430\u043f\u0435\u0432\u0442-\u044d\u043d\u0434\u043e\u0434\u043e\u043d\u0442\u0438\u0441\u0442',
          specialityIds: [305],
          totalSlots: 1,
          slots: ['11.04.2026 10:00'],
        },
      ],
      offlineDoctors: [],
      filters: { doctorIds: [981249], dateIso: '2026-04-11' },
    });

    const { res, data } = await post({
      message: '\u041a\u0430\u043a\u0438\u0435 \u0435\u0441\u0442\u044c \u043e\u043a\u043d\u0430 \u043a \u041f\u043e\u0434\u043e\u043f\u0440\u0438\u0433\u043e\u0440\u0435 11.04?',
      sessionId: 'availability-session',
    });

    expect(res.status).toBe(200);
    expect(data.action).toBe('show_availability');
    expect(data.availability.onlineDoctors).toHaveLength(1);
    expect(data.state.stage).toBe('select_slot');
  });

  it('books through slot pick and does not duplicate confirmation', async () => {
    store.state.set('booking-session', {
      flow: 'booking',
      stage: 'select_slot',
      slots: {
        service: 'treatment',
        specialty: '\u0442\u0435\u0440\u0430\u043f\u0435\u0432\u0442',
        doctorId: 981249,
        doctorName: THERAPIST_DOCTOR,
        dateIso: '',
        time: '',
        name: '',
        phone: '',
        claimId: '',
      },
      bookingContext: {
        status: 'idle',
        selectedSlot: null,
        lastBooking: null,
      },
      pendingPrompt: { type: '', nextStep: '', context: {} },
      triage: { level: 'none', signals: [] },
      conversationFlags: {
        needsHuman: false,
        lowConfidence: false,
        awaitingConfirmation: false,
      },
      ui: { type: 'availability' },
      lastAction: 'show_availability',
      updatedAt: new Date().toISOString(),
    });

    getAvailabilityDigestMock.mockResolvedValue({
      onlineDoctors: [
        {
          doctorId: 981249,
          name: THERAPIST_DOCTOR,
          role: '\u0422\u0435\u0440\u0430\u043f\u0435\u0432\u0442-\u044d\u043d\u0434\u043e\u0434\u043e\u043d\u0442\u0438\u0441\u0442',
          specialityIds: [305],
          totalSlots: 1,
          slots: ['11.04.2026 10:00'],
        },
      ],
      offlineDoctors: [],
      filters: { doctorIds: [981249], dateIso: '2026-04-11' },
    });
    createAppointmentMock.mockResolvedValue({
      confirmationCode: 'SIM-111111',
      doctor: THERAPIST_DOCTOR,
    });

    const slotPick = await post({
      message:
        '\u0417\u0430\u043f\u0438\u0448\u0438 \u043c\u0435\u043d\u044f \u043a \u041f\u043e\u0434\u043e\u043f\u0440\u0438\u0433\u043e\u0440\u0435 \u041e\u043a\u0441\u0430\u043d\u0435 \u0412\u0438\u043a\u0442\u043e\u0440\u043e\u0432\u043d\u0435 \u043d\u0430 11.04.2026 \u0432 10:00',
      sessionId: 'booking-session',
      clientAction: {
        type: 'slot_pick',
        params: {
          doctorName: THERAPIST_DOCTOR,
          date: '11.04.2026',
          time: '10:00',
        },
      },
    });

    expect(slotPick.data.action).toBe('show_booking_form');
    expect(slotPick.data.bookingForm.slot.time).toBe('10:00');

    const confirm = await post({
      message:
        '\u041e\u0441\u0442\u0430\u0432\u043b\u044f\u044e \u043a\u043e\u043d\u0442\u0430\u043a\u0442\u044b \u0434\u043b\u044f \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u044f \u0437\u0430\u043f\u0438\u0441\u0438.',
      sessionId: 'booking-session',
      clientAction: {
        type: 'booking_form_submit',
        params: {
          name: '\u0413\u043b\u0435\u0431',
          phone: '+7 (928) 466-14-33',
        },
      },
    });

    expect(confirm.data.action).toBe('confirm_booking');
    expect(confirm.data.booking.confirmationCode).toBe('SIM-111111');
    expect(createAppointmentMock).toHaveBeenCalledTimes(1);

    const duplicate = await post({
      message:
        '\u041f\u043e\u0432\u0442\u043e\u0440\u043d\u043e \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u044f\u044e \u0442\u0435 \u0436\u0435 \u043a\u043e\u043d\u0442\u0430\u043a\u0442\u044b.',
      sessionId: 'booking-session',
      clientAction: {
        type: 'booking_form_submit',
        params: {
          name: '\u0413\u043b\u0435\u0431',
          phone: '+7 (928) 466-14-33',
        },
      },
    });

    expect(duplicate.data.action).toBe('confirm_booking');
    expect(createAppointmentMock).toHaveBeenCalledTimes(1);
  });

  it('returns fresh availability when the chosen slot is already taken', async () => {
    store.state.set('occupied-slot-session', {
      flow: 'booking',
      stage: 'collect_contact',
      slots: {
        service: 'treatment',
        specialty: '\u0442\u0435\u0440\u0430\u043f\u0435\u0432\u0442',
        doctorId: 981249,
        doctorName: THERAPIST_DOCTOR,
        dateIso: '2026-04-11',
        time: '10:00',
        name: '\u0413\u043b\u0435\u0431',
        phone: '79284661433',
        claimId: '',
      },
      bookingContext: {
        status: 'idle',
        selectedSlot: null,
        lastBooking: null,
      },
      pendingPrompt: { type: '', nextStep: '', context: {} },
      triage: { level: 'none', signals: [] },
      conversationFlags: {
        needsHuman: false,
        lowConfidence: false,
        awaitingConfirmation: true,
      },
      ui: { type: 'booking_form' },
      lastAction: 'show_booking_form',
      updatedAt: new Date().toISOString(),
    });

    getAvailabilityDigestMock.mockResolvedValue({
      onlineDoctors: [
        {
          doctorId: 981249,
          name: THERAPIST_DOCTOR,
          role: '\u0422\u0435\u0440\u0430\u043f\u0435\u0432\u0442-\u044d\u043d\u0434\u043e\u0434\u043e\u043d\u0442\u0438\u0441\u0442',
          specialityIds: [305],
          totalSlots: 1,
          slots: ['11.04.2026 12:30'],
        },
      ],
      offlineDoctors: [],
      filters: { doctorIds: [981249], dateIso: '2026-04-11' },
    });

    const { data } = await post({
      message: '\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c \u0437\u0430\u043f\u0438\u0441\u044c',
      sessionId: 'occupied-slot-session',
      clientAction: {
        type: 'booking_form_submit',
        params: {
          name: '\u0413\u043b\u0435\u0431',
          phone: '+7 (928) 466-14-33',
        },
      },
    });

    expect(data.action).toBe('show_availability');
    expect(data.reply).toContain('\u0443\u0436\u0435 \u0437\u0430\u043d\u044f\u0442\u043e');
    expect(createAppointmentMock).not.toHaveBeenCalled();
  });

  it('shows a clear handoff message when Medflex clinic balance blocks booking', async () => {
    store.state.set('balance-block-session', {
      flow: 'booking',
      stage: 'collect_contact',
      slots: {
        service: 'treatment',
        specialty: '\u0442\u0435\u0440\u0430\u043f\u0435\u0432\u0442',
        doctorId: 981249,
        doctorName: THERAPIST_DOCTOR,
        dateIso: '2026-04-11',
        time: '10:00',
        name: '\u0413\u043b\u0435\u0431',
        phone: '79284661433',
        claimId: '',
      },
      bookingContext: {
        status: 'idle',
        selectedSlot: null,
        lastBooking: null,
      },
      pendingPrompt: { type: '', nextStep: '', context: {} },
      triage: { level: 'none', signals: [] },
      conversationFlags: {
        needsHuman: false,
        lowConfidence: false,
        awaitingConfirmation: true,
      },
      ui: { type: 'booking_form' },
      lastAction: 'show_booking_form',
      updatedAt: new Date().toISOString(),
    });

    getAvailabilityDigestMock.mockResolvedValue({
      onlineDoctors: [
        {
          doctorId: 981249,
          name: THERAPIST_DOCTOR,
          role: '\u0422\u0435\u0440\u0430\u043f\u0435\u0432\u0442-\u044d\u043d\u0434\u043e\u0434\u043e\u043d\u0442\u0438\u0441\u0442',
          specialityIds: [305],
          totalSlots: 1,
          slots: ['11.04.2026 10:00'],
        },
      ],
      offlineDoctors: [],
      filters: { doctorIds: [981249], dateIso: '2026-04-11' },
    });
    createAppointmentMock.mockRejectedValue(
      new Error('\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u0441\u0440\u0435\u0434\u0441\u0442\u0432 \u043d\u0430 \u0431\u0430\u043b\u0430\u043d\u0441\u0435 \u043a\u043b\u0438\u043d\u0438\u043a\u0438 \u0432 \u041c\u0435\u0434\u0424\u043b\u0435\u043a\u0441!')
    );

    const { data } = await post({
      message: '\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c \u0437\u0430\u043f\u0438\u0441\u044c',
      sessionId: 'balance-block-session',
      clientAction: {
        type: 'booking_form_submit',
        params: {
          name: '\u0413\u043b\u0435\u0431',
          phone: '+7 (928) 466-14-33',
        },
      },
    });

    expect(data.action).toBe('handoff');
    expect(data.reply).toContain('\u0410\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0437\u0430\u043f\u0438\u0441\u044c');
  });

  it('cancels by confirmation flow', async () => {
    store.history.set('cancel-session', [
      {
        role: 'assistant',
        content: '\u0417\u0430\u043f\u0438\u0441\u044c \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0430',
        booking: {
          date: '2026-04-11',
          time: '10:00',
          doctor: THERAPIST_DOCTOR,
          confirmationCode: 'SIM-333333',
        },
      },
    ]);
    cancelAppointmentMock.mockResolvedValue({ ok: true });

    const start = await post({
      message: '\u043e\u0442\u043c\u0435\u043d\u0438\u0442\u044c \u0437\u0430\u043f\u0438\u0441\u044c',
      sessionId: 'cancel-session',
    });

    expect(start.data.action).toBe('cancel_booking');
    expect(start.data.cancellation.status).toBe('confirm');
    expect(start.data.cancellation.claimId).toBe('SIM-333333');

    const confirm = await post({
      message: '\u0434\u0430',
      sessionId: 'cancel-session',
    });

    expect(confirm.data.action).toBe('cancel_booking');
    expect(confirm.data.cancellation.status).toBe('cancelled');
    expect(cancelAppointmentMock).toHaveBeenCalledWith('SIM-333333');
  });

  it('falls back to deterministic tooth pain handling when model is unavailable', async () => {
    gigaChatMock.mockRejectedValue(new Error('timeout'));

    const { data } = await post({
      message:
        '\u0443 \u043c\u0438\u043d\u044f \u0437\u0430\u0431\u043e\u043b\u0435\u043b\u0430 2 \u0437\u0443\u0431\u0430 3 \u0434\u043d\u044f \u0431\u0430\u043b\u0438\u0442',
      sessionId: 'tooth-pain-session',
    });

    expect(data.action).toBe('recommend_specialist');
    expect(data.state.slots.service).toBe('treatment');
  });

  it('routes urgent symptoms to urgent flow instead of generic menu', async () => {
    const { data } = await post({
      message:
        '\u0443 \u043c\u0435\u043d\u044f \u0442\u0435\u043c\u043f\u0435\u0440\u0430\u0442\u0443\u0440\u0430 \u0438 \u0440\u0430\u0441\u043f\u0443\u0445\u043b\u0430 \u0434\u0435\u0441\u043d\u0430',
      sessionId: 'urgent-session',
    });

    expect(data.action).toBe('handoff');
    expect(data.state.stage).toBe('urgent_triage');
    expect(data.reply).not.toContain('\u0447\u0442\u043e \u0441\u0435\u0439\u0447\u0430\u0441 \u0432\u0430\u0436\u043d\u0435\u0435');
  });

  it('handles mixed intent with price plus booking continuation', async () => {
    getAvailabilityDigestMock.mockResolvedValue({
      onlineDoctors: [
        {
          doctorId: 1348226,
          name: IMPLANT_DOCTOR,
          role: '\u0425\u0438\u0440\u0443\u0440\u0433-\u0438\u043c\u043f\u043b\u0430\u043d\u0442\u043e\u043b\u043e\u0433',
          specialityIds: [49],
          totalSlots: 1,
          slots: ['11.04.2026 11:00'],
        },
      ],
      offlineDoctors: [],
      filters: { doctorIds: [1348226], dateIso: '' },
    });

    const { data } = await post({
      message:
        '\u0421\u043a\u043e\u043b\u044c\u043a\u043e \u0441\u0442\u043e\u0438\u0442 \u0438\u043c\u043f\u043b\u0430\u043d\u0442\u0430\u0446\u0438\u044f \u0438 \u043c\u043e\u0436\u043d\u043e \u0437\u0430\u043f\u0438\u0441\u0430\u0442\u044c\u0441\u044f?',
      sessionId: 'mixed-intent-session',
    });

    expect(data.action).toBe('show_availability');
    expect(data.reply).toMatch(/45 000/i);
    expect(data.availability.onlineDoctors).toHaveLength(1);
  });

  it('keeps prosthetics context for bridge issue follow-up questions', async () => {
    const first = await post({
      message: '\u0443 \u043c\u0435\u043d\u044f \u043e\u0442\u0432\u0430\u043b\u0438\u043b\u0441\u044f \u043c\u043e\u0441\u0442',
      sessionId: 'bridge-context-session',
    });

    expect(first.data.action).toBe('recommend_specialist');
    expect(first.data.state.slots.service).toBe('prosthetics');

    const second = await post({
      message: '\u0434\u043e\u0440\u043e\u0433\u043e?',
      sessionId: 'bridge-context-session',
    });

    expect(second.data.action).toBe('ask_followup');
    expect(second.data.state.slots.service).toBe('prosthetics');
    expect(second.data.reply).toMatch(/25 000/i);
    expect(second.data.reply).not.toContain('\u041f\u043e\u043c\u043e\u0433\u0443 \u0441 \u0437\u0430\u043f\u0438\u0441\u044c\u044e');

    const third = await post({
      message: '\u044f \u043d\u0435 \u0437\u043d\u0430\u044e',
      sessionId: 'bridge-context-session',
    });

    expect(third.data.action).toBe('ask_followup');
    expect(third.data.state.slots.service).toBe('prosthetics');
    expect(third.data.reply).toContain('\u043c\u043e\u0441\u0442');
    expect(third.data.reply).not.toContain('\u041f\u043e\u043c\u043e\u0433\u0443 \u0441 \u0437\u0430\u043f\u0438\u0441\u044c\u044e');
  });

  it('uses fallback only when the message is really unclear', async () => {
    gigaChatMock.mockRejectedValue(new Error('timeout'));

    const { data } = await post({
      message: '\u044b\u0432\u0430\u043e\u043b\u043e\u0430\u044b\u0432',
      sessionId: 'generic-fallback-session',
    });

    expect(data.action).toBe('ask_followup');
    expect(data.reply).toContain('\u041f\u043e\u043c\u043e\u0433\u0443 \u0441 \u0437\u0430\u043f\u0438\u0441\u044c\u044e');
  });
});
