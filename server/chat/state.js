import { Annotation } from '@langchain/langgraph';

const EMPTY_SLOTS = {
  service: '',
  specialty: '',
  doctorId: null,
  doctorName: '',
  dateIso: '',
  time: '',
  name: '',
  phone: '',
  claimId: '',
};

const EMPTY_BOOKING_CONTEXT = {
  status: 'idle',
  selectedSlot: null,
  lastBooking: null,
};

const EMPTY_FLAGS = {
  needsHuman: false,
  lowConfidence: false,
  awaitingConfirmation: false,
};

const EMPTY_PENDING_PROMPT = {
  type: '',
  nextStep: '',
  context: {},
};

const EMPTY_TRIAGE = {
  level: 'none',
  signals: [],
};

const EMPTY_UI = {
  type: 'none',
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createEmptyConversationState() {
  return {
    flow: 'idle',
    stage: 'idle',
    intent: '',
    slots: clone(EMPTY_SLOTS),
    bookingContext: clone(EMPTY_BOOKING_CONTEXT),
    conversationFlags: clone(EMPTY_FLAGS),
    pendingPrompt: clone(EMPTY_PENDING_PROMPT),
    triage: clone(EMPTY_TRIAGE),
    ui: clone(EMPTY_UI),
    lastAction: '',
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeConversationState(state) {
  if (!state || typeof state !== 'object') {
    return createEmptyConversationState();
  }

  return {
    flow: typeof state.flow === 'string' ? state.flow : 'idle',
    stage: typeof state.stage === 'string' ? state.stage : 'idle',
    intent: typeof state.intent === 'string' ? state.intent : '',
    slots: {
      ...EMPTY_SLOTS,
      ...(state.slots && typeof state.slots === 'object' ? state.slots : {}),
    },
    bookingContext: {
      ...EMPTY_BOOKING_CONTEXT,
      ...(state.bookingContext && typeof state.bookingContext === 'object'
        ? state.bookingContext
        : {}),
    },
    conversationFlags: {
      ...EMPTY_FLAGS,
      ...(state.conversationFlags && typeof state.conversationFlags === 'object'
        ? state.conversationFlags
        : {}),
    },
    pendingPrompt: {
      ...EMPTY_PENDING_PROMPT,
      ...(state.pendingPrompt && typeof state.pendingPrompt === 'object'
        ? state.pendingPrompt
        : {}),
    },
    triage: {
      ...EMPTY_TRIAGE,
      ...(state.triage && typeof state.triage === 'object' ? state.triage : {}),
    },
    ui: {
      ...EMPTY_UI,
      ...(state.ui && typeof state.ui === 'object' ? state.ui : {}),
    },
    lastAction: typeof state.lastAction === 'string' ? state.lastAction : '',
    updatedAt:
      typeof state.updatedAt === 'string' ? state.updatedAt : new Date().toISOString(),
  };
}

export function mergeConversationState(state, patch) {
  const current = normalizeConversationState(state);
  const nextPatch = patch && typeof patch === 'object' ? patch : {};

  return normalizeConversationState({
    ...current,
    ...nextPatch,
    slots: {
      ...current.slots,
      ...(nextPatch.slots && typeof nextPatch.slots === 'object' ? nextPatch.slots : {}),
    },
    bookingContext: {
      ...current.bookingContext,
      ...(nextPatch.bookingContext && typeof nextPatch.bookingContext === 'object'
        ? nextPatch.bookingContext
        : {}),
    },
    conversationFlags: {
      ...current.conversationFlags,
      ...(nextPatch.conversationFlags &&
      typeof nextPatch.conversationFlags === 'object'
        ? nextPatch.conversationFlags
        : {}),
    },
    pendingPrompt: {
      ...current.pendingPrompt,
      ...(nextPatch.pendingPrompt && typeof nextPatch.pendingPrompt === 'object'
        ? nextPatch.pendingPrompt
        : {}),
    },
    triage: {
      ...current.triage,
      ...(nextPatch.triage && typeof nextPatch.triage === 'object' ? nextPatch.triage : {}),
    },
    ui: {
      ...current.ui,
      ...(nextPatch.ui && typeof nextPatch.ui === 'object' ? nextPatch.ui : {}),
    },
    updatedAt: new Date().toISOString(),
  });
}

export function resetConversationState() {
  return createEmptyConversationState();
}

export function createEmptyInterpretation() {
  return {
    intent: 'ask_info',
    confidence: 0,
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
    fallbackReason: '',
    triage: clone(EMPTY_TRIAGE),
  };
}

export function createEmptyRequest() {
  return {
    sessionId: '',
    trimmedMessage: '',
    pageContext: '',
    clientAction: null,
  };
}

export function createEmptyContext() {
  return {
    history: [],
    pageContext: '',
    sessionId: '',
  };
}

export function createEmptyMeta() {
  return {
    flow: 'idle',
    stage: 'idle',
    confidence: 0,
    toolUsed: '',
  };
}

function lastValue(defaultFactory) {
  return Annotation({
    reducer: (_left, right) => (right === undefined ? _left : right),
    default: defaultFactory,
  });
}

export const ChatGraphState = Annotation.Root({
  session: lastValue(() => createEmptyConversationState()),
  request: lastValue(() => createEmptyRequest()),
  context: lastValue(() => createEmptyContext()),
  interpretation: lastValue(() => createEmptyInterpretation()),
  route: lastValue(() => 'answer_info'),
  response: lastValue(() => null),
  meta: lastValue(() => createEmptyMeta()),
});
