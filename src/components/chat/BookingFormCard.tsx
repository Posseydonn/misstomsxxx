import { useEffect, useState } from 'react';
import type { BookingFormPayload } from '@/hooks/useChat';

interface BookingFormCardProps {
  bookingForm: BookingFormPayload;
  isTyping?: boolean;
  onSubmit?: (values: { name: string; phone: string }) => void;
}

export function BookingFormCard({
  bookingForm,
  isTyping = false,
  onSubmit,
}: BookingFormCardProps) {
  const [name, setName] = useState(bookingForm.values.name || '');
  const [phone, setPhone] = useState(bookingForm.values.phone || '');

  useEffect(() => {
    setName(bookingForm.values.name || '');
    setPhone(bookingForm.values.phone || '');
  }, [bookingForm.values.name, bookingForm.values.phone]);

  const handleSubmit = () => {
    if (!onSubmit || isTyping) return;
    onSubmit({
      name: name.trim(),
      phone: formatPhone(phone),
    });
  };

  return (
    <div className="mt-2 rounded-2xl border border-[hsl(168_24%_80%)] bg-[hsl(168_76%_97%)] p-3 shadow-card">
      <div className="mb-2">
        <p className="text-sm font-semibold text-[hsl(var(--clinic-navy))]">Подтверждение записи</p>
        <p className="mt-1 text-xs text-[hsl(215_20%_40%)]">
          {bookingForm.slot.doctorName && bookingForm.slot.dateIso && bookingForm.slot.time
            ? `${bookingForm.slot.doctorName} • ${formatDate(bookingForm.slot.dateIso)} • ${bookingForm.slot.time}`
            : 'Оставьте контакты, и я подтвержу запись.'}
        </p>
      </div>

      <div className="space-y-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[hsl(var(--clinic-navy-mid))]">Имя</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Как к вам обращаться"
            disabled={isTyping}
            className={`w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-colors ${
              bookingForm.validation.name
                ? 'border-[hsl(var(--clinic-red))]'
                : 'border-[hsl(210_16%_86%)] focus:border-[hsl(var(--clinic-teal))]'
            }`}
          />
          {bookingForm.validation.name && (
            <span className="mt-1 block text-xs text-[hsl(var(--clinic-red))]">
              {bookingForm.validation.name}
            </span>
          )}
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[hsl(var(--clinic-navy-mid))]">
            Телефон
          </span>
          <input
            value={phone}
            onChange={(event) => setPhone(maskPhone(event.target.value))}
            placeholder="+7 (___) ___-__-__"
            disabled={isTyping}
            className={`w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-colors ${
              bookingForm.validation.phone
                ? 'border-[hsl(var(--clinic-red))]'
                : 'border-[hsl(210_16%_86%)] focus:border-[hsl(var(--clinic-teal))]'
            }`}
          />
          {bookingForm.validation.phone && (
            <span className="mt-1 block text-xs text-[hsl(var(--clinic-red))]">
              {bookingForm.validation.phone}
            </span>
          )}
        </label>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isTyping || !onSubmit}
        className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-[hsl(var(--clinic-red))] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Подтвердить запись
      </button>
    </div>
  );
}

function formatDate(dateIso = '') {
  if (!dateIso) return '';
  try {
    return new Date(`${dateIso}T12:00:00`).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return dateIso;
  }
}

function maskPhone(value = '') {
  const digits = value.replace(/\D/g, '').replace(/^8/, '7').replace(/^([^7])/, '7$1').slice(0, 11);
  const withoutCountry = digits.startsWith('7') ? digits.slice(1) : digits;
  const parts = [
    withoutCountry.slice(0, 3),
    withoutCountry.slice(3, 6),
    withoutCountry.slice(6, 8),
    withoutCountry.slice(8, 10),
  ].filter(Boolean);

  if (parts.length === 0) return '+7';
  if (parts.length === 1) return `+7 (${parts[0]}`;
  if (parts.length === 2) return `+7 (${parts[0]}) ${parts[1]}`;
  if (parts.length === 3) return `+7 (${parts[0]}) ${parts[1]}-${parts[2]}`;
  return `+7 (${parts[0]}) ${parts[1]}-${parts[2]}-${parts[3]}`;
}

function formatPhone(value = '') {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) return `+7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith('7')) return `+${digits}`;
  if (digits.length === 10) return `+7${digits}`;
  return value;
}
