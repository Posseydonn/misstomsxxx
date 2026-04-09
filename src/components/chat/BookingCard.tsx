import { CalendarCheck, Clock, User, Hash } from 'lucide-react';
import type { Booking } from '@/hooks/useChat';

interface BookingCardProps {
  booking: Booking;
}

export function BookingCard({ booking }: BookingCardProps) {
  return (
    <div className="mt-2 space-y-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
      <div className="mb-1 flex items-center gap-2 font-semibold text-green-700">
        <CalendarCheck className="h-4 w-4" />
        Запись подтверждена
      </div>

      <div className="space-y-1.5 text-gray-700">
        {booking.date && (
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span>{formatDate(booking.date)}</span>
          </div>
        )}
        {booking.time && (
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span>{booking.time}</span>
          </div>
        )}
        {booking.doctor && (
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span>{booking.doctor}</span>
          </div>
        )}
        {booking.confirmationCode && (
          <div className="flex items-center gap-2">
            <Hash className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span>
              Код записи: <strong>{booking.confirmationCode}</strong>
            </span>
          </div>
        )}
      </div>

      <p className="border-t border-green-200 pt-1 text-xs text-gray-500">
        Мы позвоним для подтверждения. Если планы изменятся, пожалуйста, сообщите нам заранее.
      </p>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
