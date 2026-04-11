import { getChatGraph } from './graph.js';
import { normalizeHistory } from './domain.js';
import { createEmptyMeta, createEmptyRequest, normalizeConversationState } from './state.js';
import {
  getConversationState,
  getHistory,
  saveConversationState,
  saveHistory,
} from '../services/redis.js';
import { logMessage } from '../services/postgres.js';

export async function getChatSession(sessionId) {
  const [history, state] = await Promise.all([
    getHistory(sessionId),
    getConversationState(sessionId),
  ]);

  return {
    messages: normalizeHistory(history),
    state: normalizeConversationState(state),
  };
}

export async function runChatTurn({ sessionId, message, pageContext = '', clientAction = null }) {
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';
  const [historyRaw, stateRaw] = await Promise.all([
    getHistory(sessionId),
    getConversationState(sessionId),
  ]);

  const history = normalizeHistory(historyRaw);
  const state = normalizeConversationState(stateRaw);
  const graph = getChatGraph();

  const result = await graph.invoke(
    {
      session: state,
      request: {
        ...createEmptyRequest(),
        sessionId,
        trimmedMessage,
        pageContext,
        clientAction,
      },
      context: {
        history,
        pageContext,
        sessionId,
      },
      meta: createEmptyMeta(),
    },
    {
      configurable: {
        thread_id: sessionId,
      },
    }
  );

  const debugTrace = buildDebugTrace({
    clientAction,
    pageContext,
    result,
    sessionId,
    stateBefore: state,
    trimmedMessage,
  });

  maybeLogDebugTrace(debugTrace);

  await persistTurn({
    debugTrace,
    history,
    pageContext,
    sessionId,
    state: result.session,
    assistantPayload: result.response,
    userMessage: trimmedMessage,
  });

  return result.response;
}

async function persistTurn({
  assistantPayload,
  debugTrace,
  history,
  pageContext,
  sessionId,
  state,
  userMessage,
}) {
  const updatedHistory = [...history];
  const effectiveState = normalizeConversationState(state);

  if (userMessage) {
    updatedHistory.push({
      role: 'user',
      content: userMessage,
    });

    await logMessage({
      sessionId,
      role: 'user',
      content: userMessage,
      page: pageContext,
      flow: effectiveState.flow,
      stage: effectiveState.stage,
    });
  }

  updatedHistory.push({
    role: 'assistant',
    content: assistantPayload.reply,
    action: assistantPayload.action,
    availability: assistantPayload.availability,
    booking: assistantPayload.booking,
    bookingForm: assistantPayload.bookingForm,
    cancellation: assistantPayload.cancellation,
    state: assistantPayload.state,
    meta: assistantPayload.meta,
  });

  await Promise.all([
    saveHistory(sessionId, updatedHistory),
    saveConversationState(sessionId, effectiveState),
    logMessage({
      sessionId,
      role: 'assistant',
      content: assistantPayload.reply,
      page: pageContext,
      action: assistantPayload.action,
      flow: effectiveState.flow,
      stage: effectiveState.stage,
      fallbackReason: assistantPayload.fallbackReason,
      booking: assistantPayload.booking,
      medflexResult: buildMedflexLogPayload(assistantPayload),
      debugTrace,
    }),
  ]);
}

function buildMedflexLogPayload(payload) {
  if (payload.booking) return payload.booking;
  if (payload.cancellation) return payload.cancellation;
  if (payload.availability) {
    return {
      onlineDoctors: payload.availability.onlineDoctors?.length || 0,
      offlineDoctors: payload.availability.offlineDoctors?.length || 0,
      filters: payload.availability.filters || {},
    };
  }
  return null;
}

function buildDebugTrace({
  clientAction,
  pageContext,
  result,
  sessionId,
  stateBefore,
  trimmedMessage,
}) {
  return {
    sessionId,
    request: {
      message: trimmedMessage,
      pageContext,
      clientAction: clientAction || null,
    },
    stateBefore: summarizeState(stateBefore),
    interpretation: summarizeInterpretation(result.interpretation),
    route: result.route || '',
    response: {
      action: result.response?.action || '',
      fallbackReason: result.response?.fallbackReason || '',
    },
    tool: {
      used: result.meta?.toolUsed || '',
      output: buildMedflexLogPayload(result.response),
    },
    stateAfter: summarizeState(result.session),
    meta: {
      confidence: result.meta?.confidence ?? 0,
      flow: result.meta?.flow || result.session?.flow || '',
      stage: result.meta?.stage || result.session?.stage || '',
    },
    createdAt: new Date().toISOString(),
  };
}

function summarizeState(state) {
  const normalizedState = normalizeConversationState(state);

  return {
    flow: normalizedState.flow,
    stage: normalizedState.stage,
    lastAction: normalizedState.lastAction,
    pendingPrompt: normalizedState.pendingPrompt,
    triage: normalizedState.triage,
    slots: {
      service: normalizedState.slots.service,
      specialty: normalizedState.slots.specialty,
      doctorId: normalizedState.slots.doctorId,
      doctorName: normalizedState.slots.doctorName,
      dateIso: normalizedState.slots.dateIso,
      time: normalizedState.slots.time,
      claimId: normalizedState.slots.claimId,
    },
    bookingContext: {
      status: normalizedState.bookingContext.status,
      selectedSlot: normalizedState.bookingContext.selectedSlot,
      lastBooking: normalizedState.bookingContext.lastBooking,
    },
    conversationFlags: normalizedState.conversationFlags,
    ui: normalizedState.ui,
  };
}

function summarizeInterpretation(interpretation) {
  if (!interpretation || typeof interpretation !== 'object') {
    return null;
  }

  return {
    intent: interpretation.intent || '',
    requestedAction: interpretation.requestedAction || '',
    userGoal: interpretation.userGoal || '',
    confidence: interpretation.confidence ?? 0,
    fallbackReason: interpretation.fallbackReason || '',
    signals: interpretation.signals || {},
    entities: interpretation.entities || {},
    triage: interpretation.triage || null,
    missing: Array.isArray(interpretation.missing) ? interpretation.missing : [],
  };
}

function maybeLogDebugTrace(debugTrace) {
  const environment = process.env.NODE_ENV;
  const shouldLog =
    process.env.CHAT_DEBUG_TRACE === '1' ||
    environment === 'development' ||
    typeof environment === 'undefined';

  if (!shouldLog) return;

  console.log('[ChatTrace]', JSON.stringify(debugTrace));
}
