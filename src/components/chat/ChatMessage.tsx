import { BookingCard } from './BookingCard';
import { AvailabilityCard, type SlotPickPayload } from './AvailabilityCard';
import type { Message } from '@/hooks/useChat';

interface ChatMessageProps {
  message: Message;
  isTyping?: boolean;
  onSlotPick?: (slot: SlotPickPayload) => void;
  onAdminRequest?: () => void;
}

export function ChatMessage({
  message,
  isTyping = false,
  onSlotPick,
  onAdminRequest,
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
        {message.booking && <BookingCard booking={message.booking} />}
      </div>
    </div>
  );
}
