import { useEffect, useCallback, useRef } from 'react';

export type TriggerReason = 'time' | 'price_section' | 'exit_intent';

interface UseTriggersOptions {
  onTrigger: (reason: TriggerReason) => void;
  isOpen: boolean;
  /** Задержка таймера в мс, по умолчанию 30 000 */
  timerDelay?: number;
}

/**
 * Три триггера автоматического открытия чата:
 * 1. 30 секунд на странице
 * 2. Скролл до секции с ценами (Intersection Observer)
 * 3. Exit intent — мышь уходит к верхнему краю
 *
 * Каждый триггер срабатывает не более одного раза за сессию.
 */
export function useTriggers({ onTrigger, isOpen, timerDelay = 30_000 }: UseTriggersOptions) {
  const fired = useRef<Set<TriggerReason>>(new Set());

  const trigger = useCallback(
    (reason: TriggerReason) => {
      if (isOpen || fired.current.has(reason)) return;
      fired.current.add(reason);
      onTrigger(reason);
    },
    [isOpen, onTrigger]
  );

  // ── 1. Таймер 30 секунд ──────────────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => trigger('time'), timerDelay);
    return () => clearTimeout(id);
  }, [trigger, timerDelay]);

  // ── 2. Exit intent (мышь к верхней границе окна) ─────────────────────────
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (e.clientY < 10) trigger('exit_intent');
    };
    document.addEventListener('mousemove', onMouseMove);
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, [trigger]);

  // ── 3. Intersection Observer — секция с ценами ───────────────────────────
  useEffect(() => {
    // Ищем блок цен по data-атрибуту или типичным классам
    const priceEl =
      document.querySelector('[data-chat-trigger="prices"]') ??
      document.querySelector('.price') ??
      document.querySelector('#prices');

    if (!priceEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) trigger('price_section');
      },
      { threshold: 0.3 }
    );

    observer.observe(priceEl);
    return () => observer.disconnect();
  }, [trigger]);
}
