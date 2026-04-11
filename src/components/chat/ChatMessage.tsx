import { BookingCard } from './BookingCard';
import { BookingFormCard } from './BookingFormCard';
import { CancellationCard } from './CancellationCard';
import { HandoffCard } from './HandoffCard';
import { AvailabilityCard, type SlotPickPayload } from './AvailabilityCard';
import type { Message } from '@/hooks/useChat';

interface ChatMessageProps {
  message: Message;
  isTyping?: boolean;
  onSlotPick?: (slot: SlotPickPayload) => void;
  onAdminRequest?: () => void;
  onBookingFormSubmit?: (values: { name: string; phone: string }) => void;
  onCancellationLookup?: (claimId: string) => void;
  onCancellationConfirm?: (claimId?: string) => void;
}

export function ChatMessage({
  message,
  isTyping = false,
  onSlotPick,
  onAdminRequest,
  onBookingFormSubmit,
  onCancellationLookup,
  onCancellationConfirm,
}: ChatMessageProps) {
  const isBot = message.role === 'assistant';

  return (
    <div className={`mb-3 flex items-end gap-2 ${isBot ? '' : 'flex-row-reverse'}`}>
      {isBot && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(0_65%_51%)] text-xs font-bold text-white">
          Д
        </div>
      )}

      <div className={`flex max-w-[88%] flex-col ${isBot ? '' : 'items-end'}`}>
        <div
          className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isBot
              ? 'rounded-bl-sm border border-gray-100 bg-white text-gray-800 shadow-sm'
              : 'rounded-br-sm bg-[hsl(0_65%_51%)] text-white'
          }`}
        >
          {message.content}
        </div>

        {message.availability && (
          <AvailabilityCard
            availability={message.availability}
            isTyping={isTyping}
            onSlotPick={onSlotPick}
            onAdminRequest={onAdminRequest}
          />
        )}
        {message.bookingForm && (
          <BookingFormCard
            bookingForm={message.bookingForm}
            isTyping={isTyping}
            onSubmit={onBookingFormSubmit}
          />
        )}
        {message.booking && <BookingCard booking={message.booking} />}
        {message.cancellation && (
          <CancellationCard
            cancellation={message.cancellation}
            isTyping={isTyping}
            onLookup={onCancellationLookup}
            onConfirm={onCancellationConfirm}
          />
        )}
        {message.action === 'handoff' && (
          <HandoffCard
            content={message.content}
            bookingForm={message.bookingForm}
            state={message.state}
            fallbackReason={message.fallbackReason}
            meta={message.meta}
          />
        )}
      </div>
    </div>
  );
}
