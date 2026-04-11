import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BookingFormCard } from './BookingFormCard';

describe('BookingFormCard', () => {
  it('submits name and phone', () => {
    const onSubmit = vi.fn();

    render(
      <BookingFormCard
        bookingForm={{
          slot: {
            doctorName: 'Подопригора Оксана Викторовна',
            dateIso: '2026-04-11',
            time: '10:00',
          },
          values: {
            name: '',
            phone: '',
          },
          validation: {},
          fields: [
            { name: 'name', label: 'Имя', type: 'text', required: true },
            { name: 'phone', label: 'Телефон', type: 'tel', required: true },
          ],
        }}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/как к вам обращаться/i), {
      target: { value: 'Глеб' },
    });
    fireEvent.change(screen.getByPlaceholderText(/\+7/i), {
      target: { value: '9991112233' },
    });
    fireEvent.click(screen.getByRole('button', { name: /подтвердить запись/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Глеб',
      phone: '+79991112233',
    });
  });
});
