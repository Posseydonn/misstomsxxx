import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CancellationCard } from './CancellationCard';

describe('CancellationCard', () => {
  it('sends claim id lookup', () => {
    const onLookup = vi.fn();

    render(
      <CancellationCard
        cancellation={{ status: 'need_claim_id' }}
        onLookup={onLookup}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/sim-123456/i), {
      target: { value: 'SIM-555555' },
    });
    fireEvent.click(screen.getByRole('button', { name: /найти запись/i }));

    expect(onLookup).toHaveBeenCalledWith('SIM-555555');
  });
});
