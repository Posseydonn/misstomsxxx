import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HandoffCard } from './HandoffCard';

describe('HandoffCard', () => {
  it('renders a clear Medflex outage handoff state', () => {
    render(
      <HandoffCard
        content="Автоматическая запись сейчас временно недоступна. Я передам заявку администратору, чтобы с вами связались и подтвердили визит вручную."
        bookingForm={{
          slot: {
            doctorName: 'Алисултанов Арсен Русланович',
            dateIso: '2026-04-10',
            time: '17:00',
          },
          values: { name: 'Глеб', phone: '+79284661433' },
          validation: {},
          fields: [
            { name: 'name', label: 'Имя', type: 'text', required: true },
            { name: 'phone', label: 'Телефон', type: 'tel', required: true },
          ],
        }}
        fallbackReason='Medflex POST /direct_appointment/doctor/execute/ -> 400: {"detail":"Недостаточно средств на балансе клиники в МедФлекс!"}'
        meta={{
          flow: 'handoff',
          stage: 'handoff',
          confidence: 1,
          toolUsed: 'tool_create_booking',
        }}
      />
    );

    expect(screen.getByText(/Автозапись временно недоступна/i)).toBeInTheDocument();
    expect(screen.getByText(/Сохраненная заявка/i)).toBeInTheDocument();
    expect(screen.getByText(/Алисултанов Арсен Русланович/i)).toBeInTheDocument();
    expect(screen.getByText(/tool_create_booking/i)).toBeInTheDocument();
  });
});
