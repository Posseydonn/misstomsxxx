import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const store = {
  history: new Map(),
  state: new Map(),
};

const getAvailabilityDigestMock = vi.fn();

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
  createAppointment: vi.fn(),
  cancelAppointment: vi.fn(),
  getAvailabilityDigest: getAvailabilityDigestMock,
  normalizePhone: (phone) => String(phone).replace(/\D/g, ''),
}));

vi.mock('../services/gigachat.js', () => ({
  chat: vi.fn(),
}));

vi.mock('../services/postgres.js', () => ({
  initDb: vi.fn(async () => true),
  logMessage: vi.fn(),
}));

describe('chat follow-up availability', () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    store.history.clear();
    store.state.clear();
    getAvailabilityDigestMock.mockReset();

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

  it('treats short confirmation after recommendation as availability request', async () => {
    store.state.set('followup-session', {
      flow: 'booking',
      stage: 'recommend_specialist',
      slots: {
        service: 'implantation',
        specialty: 'хирург-имплантолог',
        doctorId: 1348226,
        doctorName: 'Шовгенов Тембот Нальбиевич',
        dateIso: '',
        time: '',
        name: '',
        phone: '',
        claimId: '',
      },
      pendingPrompt: {
        type: 'offer_availability',
        nextStep: 'show_availability',
        context: {
          service: 'implantation',
          specialty: 'хирург-имплантолог',
        },
      },
      lastAction: 'recommend_specialist',
      updatedAt: new Date().toISOString(),
    });

    getAvailabilityDigestMock.mockResolvedValue({
      onlineDoctors: [
        {
          doctorId: 1348226,
          name: 'Шовгенов Тембот Нальбиевич',
          role: 'Хирург-имплантолог',
          specialityIds: [49],
          totalSlots: 1,
          slots: ['11.04.2026 11:00'],
        },
      ],
      offlineDoctors: [],
      filters: { doctorIds: [1348226], dateIso: '' },
    });

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Подскажите пожалуйста',
        sessionId: 'followup-session',
      }),
    });

    const data = await res.json();
    expect(data.action).toBe('show_availability');
    expect(data.availability.onlineDoctors).toHaveLength(1);
    expect(data.state.stage).toBe('select_slot');
  });

  it('treats filler confirmation like "ну давайте тогда" as a pending-step continuation', async () => {
    store.state.set('filler-followup-session', {
      flow: 'consultation',
      stage: 'recommend_specialist',
      slots: {
        service: 'treatment',
        specialty: 'терапевт',
        doctorId: 981249,
        doctorName: 'Подопригора Оксана Викторовна',
        dateIso: '',
        time: '',
        name: '',
        phone: '',
        claimId: '',
      },
      pendingPrompt: {
        type: 'offer_availability',
        nextStep: 'show_availability',
        context: {
          service: 'treatment',
          specialty: 'терапевт',
        },
      },
      lastAction: 'recommend_specialist',
      updatedAt: new Date().toISOString(),
    });

    getAvailabilityDigestMock.mockResolvedValue({
      onlineDoctors: [
        {
          doctorId: 981249,
          name: 'Подопригора Оксана Викторовна',
          role: 'Терапевт-эндодонтист',
          specialityIds: [305],
          totalSlots: 1,
          slots: ['11.04.2026 10:00'],
        },
      ],
      offlineDoctors: [],
      filters: { doctorIds: [981249], dateIso: '' },
    });

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'ну давайте тогда',
        sessionId: 'filler-followup-session',
      }),
    });

    const data = await res.json();
    expect(data.action).toBe('show_availability');
    expect(data.availability.onlineDoctors).toHaveLength(1);
  });

  it('continues pending next step after price answer on short affirmation', async () => {
    const priceRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Сколько стоит имплантация?',
        sessionId: 'price-followup-session',
      }),
    });

    const priceData = await priceRes.json();
    expect(priceData.action).toBe('ask_followup');
    expect(priceData.reply).toMatch(/имплантация/i);
    expect(priceData.state.pendingPrompt.nextStep).toBe('show_availability');

    getAvailabilityDigestMock.mockResolvedValue({
      onlineDoctors: [
        {
          doctorId: 1348226,
          name: 'Шовгенов Тембот Нальбиевич',
          role: 'Хирург-имплантолог',
          specialityIds: [49],
          totalSlots: 1,
          slots: ['11.04.2026 11:00'],
        },
      ],
      offlineDoctors: [],
      filters: { doctorIds: [1348226], dateIso: '' },
    });

    const followupRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'давайте',
        sessionId: 'price-followup-session',
      }),
    });

    const followupData = await followupRes.json();
    expect(followupData.action).toBe('show_availability');
    expect(followupData.availability.onlineDoctors).toHaveLength(1);
  });

  it('detects implant intent deterministically before model fallback', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Да, хочу имплант',
        sessionId: 'implant-intent-session',
      }),
    });

    const data = await res.json();
    expect(data.action).toBe('recommend_specialist');
    expect(data.state.stage).toBe('recommend_specialist');
    expect(data.state.slots.service).toBe('implantation');
  });
});
