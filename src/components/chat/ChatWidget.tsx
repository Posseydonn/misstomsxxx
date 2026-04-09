import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useTriggers } from '@/hooks/useTriggers';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import type { SlotPickPayload } from './AvailabilityCard';

declare global {
  interface Window {
    ym?: (counterId: number, action: string, goal: string) => void;
  }
}

const YM_COUNTER = Number(import.meta.env.VITE_YM_COUNTER_ID) || 0;

function ymGoal(goal: string) {
  if (YM_COUNTER && window.ym) window.ym(YM_COUNTER, 'reachGoal', goal);
}

const PAGE_GREETINGS: Record<string, string> = {
  '/': 'Здравствуйте! Подскажу по услугам и помогу записаться на прием.',
  '/services': 'Какая услуга вас интересует? Помогу выбрать подходящий вариант.',
  '/services/implantation':
    'Рассматриваете имплантацию? Подскажу этапы, сроки и помогу записаться на консультацию.',
  '/services/veneers':
    'Хотите красивую улыбку с винирами? Расскажу о вариантах и ближайших окнах для записи.',
  '/services/braces':
    'Интересует исправление прикуса? Помогу выбрать между брекетами и элайнерами.',
  '/services/hygiene':
    'Планируете профгигиену? Подскажу стоимость и помогу выбрать удобное время.',
  '/services/treatment':
    'Беспокоит зуб? Расскажите, что именно, и я подскажу, к какому врачу лучше записаться.',
  '/services/whitening': 'Хотите отбеливание? Подскажу по методам и доступным датам.',
  '/services/pediatric':
    'Нужен детский стоматолог? Помогу записать ребенка к подходящему специалисту.',
  '/services/diagnostics':
    'Нужна диагностика или КТ? Подскажу, как проходит прием и когда есть свободные окна.',
  '/services/prosthetics':
    'Рассматриваете протезирование? Подскажу варианты и помогу записаться на консультацию.',
  '/doctors': 'Хотите выбрать врача? Расскажу о специалистах и помогу записаться.',
  '/about': 'Расскажу о клинике или сразу помогу оформить запись.',
  '/contacts': 'Помогу выбрать филиал и удобное время для визита.',
  '/reviews': 'Спасибо за интерес к нашей клинике. Помогу записаться на прием.',
};

function getGreeting(pathname: string): string {
  return (
    PAGE_GREETINGS[pathname] ??
    PAGE_GREETINGS[pathname.split('/').slice(0, 2).join('/')] ??
    'Здравствуйте! Подскажу по услугам и помогу записаться на прием.'
  );
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [greetingSent, setGreetingSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const { messages, isTyping, sendMessage, addGreeting } = useChat();

  const openChat = useCallback(() => {
    setIsOpen(true);
    ymGoal('chat_opened');
  }, []);

  useTriggers({ onTrigger: openChat, isOpen });

  useEffect(() => {
    if (isOpen && !greetingSent) {
      addGreeting(getGreeting(location.pathname));
      setGreetingSent(true);
    }
  }, [isOpen, greetingSent, addGreeting, location.pathname]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');
    sendMessage(text, location.pathname);
  }, [input, isTyping, sendMessage, location.pathname]);

  const handleSlotPick = useCallback(
    ({ doctorName, date, time }: SlotPickPayload) => {
      if (isTyping) return;
      const text = `Запиши меня к ${doctorName} на ${date} в ${time}`;
      sendMessage(text, location.pathname);
    },
    [isTyping, sendMessage, location.pathname]
  );

  const handleAdminRequest = useCallback(() => {
    if (isTyping) return;
    sendMessage('Передайте заявку администратору, пожалуйста.', location.pathname);
  }, [isTyping, sendMessage, location.pathname]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 z-50 flex flex-col overflow-hidden rounded-2xl shadow-2xl"
          style={{
            width: 'min(380px, calc(100vw - 32px))',
            height: 'min(560px, calc(100dvh - 120px))',
            background: '#f8f8f8',
          }}
        >
          <div
            className="flex shrink-0 items-center justify-between px-4 py-3"
            style={{ background: 'hsl(0 65% 51%)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                Д
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight text-white">Дарья</p>
                <p className="text-xs text-white/80">Администратор • Онлайн</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
              aria-label="Закрыть чат"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {messages.length === 0 && (
              <p className="mt-8 text-center text-xs text-gray-400">Начните диалог...</p>
            )}
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isTyping={isTyping}
                onSlotPick={handleSlotPick}
                onAdminRequest={handleAdminRequest}
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Напишите сообщение..."
                maxLength={1000}
                disabled={isTyping}
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(0_65%_51%)] disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-40"
                style={{ background: 'hsl(0 65% 51%)' }}
                aria-label="Отправить"
              >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => (isOpen ? setIsOpen(false) : openChat())}
        className="fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
        style={{ background: 'hsl(0 65% 51%)' }}
        aria-label={isOpen ? 'Закрыть чат' : 'Открыть чат'}
      >
        <div className="relative">
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <>
              <MessageCircle className="h-6 w-6 text-white" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-400" />
            </>
          )}
        </div>
      </button>
    </>
  );
}
