jest.mock('../../edit-appointment/api/updateBookingById', () => ({
  updateBookingById: jest.fn(),
}));

import { updateBookingById } from '../../edit-appointment/api/updateBookingById';
import { updateBookingNotes } from '../api/updateBookingNotes';

describe('updateBookingNotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves trimmed visit notes on the booking', async () => {
    updateBookingById.mockResolvedValue({ data: { id: 'book-1' }, error: null });

    const result = await updateBookingNotes('book-1', '  Side gate  ', 'biz-9');

    expect(result).toEqual({ ok: true, bookingId: 'book-1', notes: 'Side gate' });
    expect(updateBookingById).toHaveBeenCalledWith(
      'book-1',
      { customer_notes: 'Side gate' },
      'biz-9',
    );
  });

  it('clears notes when the text is empty', async () => {
    updateBookingById.mockResolvedValue({ data: { id: 'book-1' }, error: null });

    const result = await updateBookingNotes('book-1', '   ');

    expect(result).toEqual({ ok: true, bookingId: 'book-1', notes: '' });
    expect(updateBookingById).toHaveBeenCalledWith('book-1', { customer_notes: '' }, undefined);
  });

  it('returns the save error', async () => {
    updateBookingById.mockResolvedValue({ data: null, error: { message: 'RLS denied' } });

    const result = await updateBookingNotes('book-1', 'Side gate');

    expect(result.ok).toBe(false);
    expect(result.error?.message).toBe('RLS denied');
  });
});
