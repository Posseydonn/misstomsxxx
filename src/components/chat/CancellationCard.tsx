import { useState } from 'react';
import type { CancellationPayload } from '@/hooks/useChat';

interface CancellationCardProps {
  cancellation: CancellationPayload;
  isTyping?: boolean;
  onLookup?: (claimId: string) => void;
  onConfirm?: (claimId?: string) => void;
}

export function CancellationCard({
  cancellation,
  isTyping = false,
  onLookup,
  onConfirm,
}: CancellationCardProps) {
  const [claimId, setClaimId] = useState(cancellation.claimId || '');

  if (cancellation.status === 'cancelled') {
    return (
      <div className="mt-2 rounded-2xl border border-[hsl(151_40%_80%)] bg-[hsl(151_50%_96%)] p-3 text-sm text-[hsl(151_60%_24%)]">
        Запись отменена{cancellation.claimId ? ` • код ${cancellation.claimId}` : ''}.
      </div>
    );
  }

  if (cancellation.status === 'failed') {
    return (
      <div className="mt-2 rounded-2xl border border-[hsl(0_75%_85%)] bg-[hsl(0_100%_97%)] p-3 text-sm text-[hsl(var(--clinic-red-dark))]">
        Автоматическая отмена не сработала. Лучше дождаться звонка администратора.
      </div>
    );
  }

  if (cancellation.status === 'confirm') {
    return (
      <div className="mt-2 rounded-2xl border border-[hsl(39_72%_78%)] bg-[hsl(44_100%_96%)] p-3 shadow-card">
        <p className="text-sm font-semibold text-[hsl(35_72%_28%)]">
          Подтвердите отмену записи
        </p>
        <p className="mt-1 text-xs text-[hsl(35_36%_35%)]">
          Код записи: <strong>{cancellation.claimId}</strong>
        </p>
        <button
          type="button"
          onClick={() => onConfirm?.(cancellation.claimId)}
          disabled={isTyping || !onConfirm}
          className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-[hsl(var(--clinic-red))] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Отменить запись
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-2xl border border-[hsl(210_16%_86%)] bg-white p-3 shadow-card">
      <p className="text-sm font-semibold text-[hsl(var(--clinic-navy))]">Отмена записи</p>
      <p className="mt-1 text-xs text-[hsl(215_20%_40%)]">
        Введите код записи, и я подготовлю отмену.
      </p>
      <input
        value={claimId}
        onChange={(event) => setClaimId(event.target.value)}
        placeholder="Например, SIM-123456"
        disabled={isTyping}
        className="mt-2 w-full rounded-xl border border-[hsl(210_16%_86%)] bg-[hsl(0_0%_99%)] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(var(--clinic-teal))]"
      />
      <button
        type="button"
        onClick={() => onLookup?.(claimId.trim())}
        disabled={isTyping || !claimId.trim() || !onLookup}
        className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-[hsl(var(--clinic-red))] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Найти запись
      </button>
    </div>
  );
}
