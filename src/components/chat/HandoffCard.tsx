import { AlertTriangle, Clock3, PhoneCall, ShieldAlert } from 'lucide-react';
import type { BookingFormPayload, ConversationState, ResponseMeta } from '@/hooks/useChat';

interface HandoffCardProps {
  content: string;
  bookingForm?: BookingFormPayload;
  state?: ConversationState;
  fallbackReason?: string;
  meta?: ResponseMeta;
}

export function HandoffCard({
  content,
  bookingForm,
  state,
  fallbackReason,
  meta,
}: HandoffCardProps) {
  const slot = bookingForm?.slot ||
    (state?.slots?.doctorName && state?.slots?.dateIso && state?.slots?.time
      ? {
          doctorName: state.slots.doctorName,
          dateIso: state.slots.dateIso,
          time: state.slots.time,
        }
      : null);

  const isClinicBalanceIssue = /Недостаточно средств на балансе клиники/i.test(
    fallbackReason || ''
  );

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-[hsl(15_85%_86%)] bg-[linear-gradient(180deg,hsl(20_100%_98%),hsl(0_0%_100%))] shadow-card">
      <div className="border-b border-[hsl(16_68%_88%)] bg-[linear-gradient(135deg,hsl(11_88%_57%),hsl(20_91%_63%))] px-4 py-3 text-white">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/18 ring-1 ring-white/20">
            {isClinicBalanceIssue ? (
              <ShieldAlert className="h-4.5 w-4.5" />
            ) : (
              <AlertTriangle className="h-4.5 w-4.5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">
              {isClinicBalanceIssue
                ? 'Автозапись временно недоступна'
                : 'Нужна помощь администратора'}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/88">
              {isClinicBalanceIssue
                ? 'Заявка уже сохранена. Дальше запись подтвердят вручную.'
                : 'Мы уже перевели этот запрос в ручную обработку.'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        <p className="text-sm leading-relaxed text-[hsl(225_18%_24%)]">{content}</p>

        {slot && (
          <div className="rounded-xl border border-[hsl(18_52%_88%)] bg-[hsl(24_80%_97%)] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(15_55%_42%)]">
              Сохраненная заявка
            </p>
            <div className="mt-2 space-y-1.5 text-sm text-[hsl(225_18%_24%)]">
              <p className="font-medium">{slot.doctorName}</p>
              <p>
                {formatDate(slot.dateIso)} в {slot.time}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-[hsl(210_16%_90%)] bg-[hsl(210_33%_98%)] p-3">
            <div className="flex items-center gap-2 text-[hsl(219_55%_34%)]">
              <Clock3 className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.12em]">Что дальше</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[hsl(225_18%_24%)]">
              Администратор увидит заявку и свяжется с вами, чтобы подтвердить визит вручную.
            </p>
          </div>

          <div className="rounded-xl border border-[hsl(210_16%_90%)] bg-white p-3">
            <div className="flex items-center gap-2 text-[hsl(219_55%_34%)]">
              <PhoneCall className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.12em]">Статус</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[hsl(225_18%_24%)]">
              {isClinicBalanceIssue
                ? 'Проблема сейчас на стороне Medflex, а не в ваших данных.'
                : 'Дополнительных действий от вас не требуется.'}
            </p>
          </div>
        </div>

        {meta?.toolUsed && (
          <p className="text-[11px] text-[hsl(215_14%_52%)]">
            Технический статус: {meta.toolUsed}
          </p>
        )}
      </div>
    </div>
  );
}

function formatDate(dateIso = '') {
  if (!dateIso) return '';
  try {
    return new Date(`${dateIso}T12:00:00`).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateIso;
  }
}
