import { useState, useCallback, useRef } from 'react';

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
  text?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  booking?: Booking;
  availability?: AvailabilityPayload;
}

const API_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:3001/api/chat';

function getOrCreateSessionId(): string {
  const key = 'chat_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const sessionId = useRef(getOrCreateSessionId());

  const addMessage = useCallback((msg: Omit<Message, 'id'>) => {
    const full: Message = { ...msg, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
    setMessages((prev) => [...prev, full]);
    return full;
  }, []);

  const sendMessage = useCallback(
    async (content: string, pageContext?: string) => {
      if (!content.trim() || isTyping) return;

      addMessage({ role: 'user', content });
      setIsTyping(true);

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content.trim(),
            sessionId: sessionId.current,
            pageContext: pageContext ?? window.location.pathname,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: { reply: string; booking?: Booking; availability?: AvailabilityPayload } =
          await res.json();

        addMessage({
          role: 'assistant',
          content: data.reply,
          booking: data.booking,
          availability: data.availability,
        });

        if (data.booking) {
          const counterId = Number(import.meta.env.VITE_YM_COUNTER_ID);
          if (counterId && window.ym) {
            window.ym(counterId, 'reachGoal', 'chat_booking_created');
          }
        }
      } catch {
        addMessage({
          role: 'assistant',
          content: 'Что-то пошло не так. Пожалуйста, попробуйте еще раз или позвоните нам.',
        });
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, addMessage]
  );

  const addGreeting = useCallback(
    (content: string) => {
      addMessage({ role: 'assistant', content });
    },
    [addMessage]
  );

  return { messages, isTyping, sendMessage, addGreeting };
}
