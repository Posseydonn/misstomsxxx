import { useCallback, useEffect, useRef, useState } from 'react';

export interface Booking {
  date: string;
  time: string;
  doctor: string;
  confirmationCode: string;
}

export interface AvailabilityOnlineDoctor {
  doctorId: number;
  name: string;
  role: string;
  specialityIds: number[];
  totalSlots: number;
  slots: string[];
}

export interface AvailabilityOfflineDoctor {
  name: string;
  role: string;
}

export interface AvailabilityPayload {
  onlineDoctors: AvailabilityOnlineDoctor[];
  offlineDoctors: AvailabilityOfflineDoctor[];
  filters?: {
    doctorIds?: number[];
    dateIso?: string;
  };
}

export interface BookingFormPayload {
  slot: {
    doctorName: string;
    dateIso: string;
    time: string;
  };
  values: {
    name: string;
    phone: string;
  };
  validation: {
    name?: string;
    phone?: string;
  };
  fields: Array<{
    name: 'name' | 'phone';
    label: string;
    type: 'text' | 'tel';
    required: boolean;
  }>;
}

export interface CancellationPayload {
  status: 'need_claim_id' | 'confirm' | 'cancelled' | 'failed';
  claimId?: string;
}

export interface ConversationState {
  flow: string;
  stage: string;
  intent?: string;
  slots: {
    service: string;
    specialty: string;
    doctorId: number | null;
    doctorName: string;
    dateIso: string;
    time: string;
    name: string;
    phone: string;
    claimId: string;
  };
  bookingContext?: {
    status: string;
    selectedSlot: {
      dateIso: string;
      time: string;
      doctorName: string;
    } | null;
    lastBooking: Booking | null;
  };
  conversationFlags?: {
    needsHuman: boolean;
    lowConfidence: boolean;
    awaitingConfirmation: boolean;
  };
  ui?: {
    type: string;
  };
  lastAction: string;
  updatedAt?: string;
}

export interface ResponseMeta {
  flow: string;
  stage: string;
  confidence: number;
  toolUsed: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: string;
  booking?: Booking;
  availability?: AvailabilityPayload;
  bookingForm?: BookingFormPayload;
  cancellation?: CancellationPayload;
  state?: ConversationState;
  fallbackReason?: string;
  meta?: ResponseMeta;
}

export interface ClientAction {
  type:
    | 'slot_pick'
    | 'booking_form_submit'
    | 'cancel_start'
    | 'cancellation_lookup'
    | 'cancellation_confirm';
  params?: Record<string, unknown>;
}

interface ChatResponse {
  reply: string;
  action: string;
  state: ConversationState;
  availability?: AvailabilityPayload;
  bookingForm?: BookingFormPayload;
  booking?: Booking;
  cancellation?: CancellationPayload;
  fallbackReason?: string;
  meta?: ResponseMeta;
}

const API_URL = import.meta.env.VITE_CHAT_API_URL || '/api/chat';
const SESSION_URL = `${API_URL}/session`;

function getOrCreateSessionId(): string {
  const key = 'chat_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function messageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function storageKey(sessionId: string) {
  return `chat_messages_${sessionId}`;
}

function stateStorageKey(sessionId: string) {
  return `chat_state_${sessionId}`;
}

function readStoredMessages(sessionId: string): Message[] {
  try {
    const raw = localStorage.getItem(storageKey(sessionId));
    if (!raw) return [];
    return normalizeMessages(JSON.parse(raw));
  } catch {
    return [];
  }
}

function readStoredState(sessionId: string): ConversationState | null {
  try {
    const raw = localStorage.getItem(stateStorageKey(sessionId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeMessages(messages: unknown): Message[] {
  if (!Array.isArray(messages)) return [];

  return messages
    .map((message) => {
      if (!message || typeof message !== 'object') return null;
      const value = message as Partial<Message>;
      if (value.role !== 'user' && value.role !== 'assistant') return null;
      return {
        id: typeof value.id === 'string' ? value.id : messageId(),
        role: value.role,
        content: typeof value.content === 'string' ? value.content : '',
        action: typeof value.action === 'string' ? value.action : undefined,
        booking: value.booking,
        availability: value.availability,
        bookingForm: value.bookingForm,
        cancellation: value.cancellation,
        state: value.state,
        fallbackReason:
          typeof value.fallbackReason === 'string' ? value.fallbackReason : undefined,
        meta: value.meta,
      };
    })
    .filter((message): message is Message => Boolean(message));
}

export function useChat() {
  const sessionId = useRef(getOrCreateSessionId());
  const [messages, setMessages] = useState<Message[]>(() => readStoredMessages(sessionId.current));
  const [conversationState, setConversationState] = useState<ConversationState | null>(() =>
    readStoredState(sessionId.current)
  );
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey(sessionId.current), JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (conversationState) {
      localStorage.setItem(stateStorageKey(sessionId.current), JSON.stringify(conversationState));
    }
  }, [conversationState]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      try {
        const res = await fetch(`${SESSION_URL}?sessionId=${encodeURIComponent(sessionId.current)}`);
        if (!res.ok) return;
        const data: { messages?: Message[]; state?: ConversationState } = await res.json();
        if (cancelled) return;

        const serverMessages = normalizeMessages(data.messages || []);
        if (serverMessages.length > 0 && serverMessages.length >= messages.length) {
          setMessages(serverMessages);
        }
        if (data.state) {
          setConversationState(data.state);
        }
      } catch {
        // no-op: local storage acts as fallback
      }
    }

    hydrateSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const addMessage = useCallback((message: Omit<Message, 'id'>) => {
    const fullMessage: Message = { ...message, id: messageId() };
    setMessages((prev) => [...prev, fullMessage]);
    if (fullMessage.state) {
      setConversationState(fullMessage.state);
    }
    return fullMessage;
  }, []);

  const addAssistantPayload = useCallback(
    (data: ChatResponse) => {
      addMessage({
        role: 'assistant',
        content: data.reply,
        action: data.action,
        booking: data.booking,
        availability: data.availability,
        bookingForm: data.bookingForm,
        cancellation: data.cancellation,
        state: data.state,
        fallbackReason: data.fallbackReason,
        meta: data.meta,
      });

      setConversationState(data.state);

      if (data.booking) {
        const counterId = Number(import.meta.env.VITE_YM_COUNTER_ID);
        if (counterId && window.ym) {
          window.ym(counterId, 'reachGoal', 'chat_booking_created');
        }
      }
    },
    [addMessage]
  );

  const sendRequest = useCallback(
    async ({
      content = '',
      pageContext,
      clientAction,
      optimisticUserMessage,
    }: {
      content?: string;
      pageContext?: string;
      clientAction?: ClientAction;
      optimisticUserMessage?: string;
    }) => {
      const text = content.trim();
      if ((!text && !clientAction) || isTyping) return;

      if (optimisticUserMessage) {
        addMessage({ role: 'user', content: optimisticUserMessage });
      }

      setIsTyping(true);

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            clientAction,
            sessionId: sessionId.current,
            pageContext: pageContext ?? window.location.pathname,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: ChatResponse = await res.json();
        addAssistantPayload(data);
      } catch {
        addMessage({
          role: 'assistant',
          content: 'Что-то пошло не так. Пожалуйста, попробуйте еще раз или позвоните нам.',
        });
      } finally {
        setIsTyping(false);
      }
    },
    [addAssistantPayload, addMessage, isTyping]
  );

  const sendMessage = useCallback(
    async (content: string, pageContext?: string) => {
      const text = content.trim();
      if (!text) return;
      await sendRequest({
        content: text,
        pageContext,
        optimisticUserMessage: text,
      });
    },
    [sendRequest]
  );

  const sendClientAction = useCallback(
    async (clientAction: ClientAction, optimisticUserMessage: string, pageContext?: string) => {
      await sendRequest({
        content: optimisticUserMessage,
        clientAction,
        pageContext,
        optimisticUserMessage,
      });
    },
    [sendRequest]
  );

  const addGreeting = useCallback(
    (content: string) => {
      addMessage({ role: 'assistant', content });
    },
    [addMessage]
  );

  return {
    messages,
    isTyping,
    conversationState,
    sendMessage,
    sendClientAction,
    addGreeting,
  };
}
