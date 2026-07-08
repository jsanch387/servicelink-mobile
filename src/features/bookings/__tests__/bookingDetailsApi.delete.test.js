jest.mock('../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../../lib/supabase';
import { deleteBookingById } from '../booking-details/api/bookingDetails';

describe('deleteBookingById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes session fee lines, booking_invoices, booking_payments, then bookings row', async () => {
    const feeEq = jest.fn().mockResolvedValue({ error: null });
    const feeDelete = jest.fn(() => ({ eq: feeEq }));

    const invoiceEq = jest.fn().mockResolvedValue({ error: null });
    const invoiceDelete = jest.fn(() => ({ eq: invoiceEq }));

    const payEq = jest.fn().mockResolvedValue({ error: null });
    const payDelete = jest.fn(() => ({ eq: payEq }));

    const bookingMaybeSingle = jest.fn().mockResolvedValue({
      data: { id: 'book-1' },
      error: null,
    });
    const bookingSelect = jest.fn(() => ({ maybeSingle: bookingMaybeSingle }));
    const bookingEq = jest.fn(() => ({ select: bookingSelect }));
    const bookingDelete = jest.fn(() => ({ eq: bookingEq }));

    supabase.from.mockImplementation((table) => {
      if (table === 'booking_session_fee_lines') {
        return { delete: feeDelete };
      }
      if (table === 'booking_invoices') {
        return { delete: invoiceDelete };
      }
      if (table === 'booking_payments') {
        return { delete: payDelete };
      }
      if (table === 'bookings') {
        return { delete: bookingDelete };
      }
      return {};
    });

    const { data, error } = await deleteBookingById('book-1');

    expect(error).toBeNull();
    expect(data).toEqual({ id: 'book-1' });
    expect(supabase.from).toHaveBeenCalledWith('booking_session_fee_lines');
    expect(supabase.from).toHaveBeenCalledWith('booking_invoices');
    expect(supabase.from).toHaveBeenCalledWith('booking_payments');
    expect(supabase.from).toHaveBeenCalledWith('bookings');
    expect(feeDelete).toHaveBeenCalled();
    expect(invoiceDelete).toHaveBeenCalled();
    expect(payDelete).toHaveBeenCalled();
    expect(bookingDelete).toHaveBeenCalled();
  });

  it('returns payment delete error without deleting booking', async () => {
    const feeEq = jest.fn().mockResolvedValue({ error: null });
    const feeDelete = jest.fn(() => ({ eq: feeEq }));

    const invoiceEq = jest.fn().mockResolvedValue({ error: null });
    const invoiceDelete = jest.fn(() => ({ eq: invoiceEq }));

    const payEq = jest.fn().mockResolvedValue({ error: { message: 'RLS on payments' } });
    const payDelete = jest.fn(() => ({ eq: payEq }));
    const bookingDelete = jest.fn();

    supabase.from.mockImplementation((table) => {
      if (table === 'booking_session_fee_lines') {
        return { delete: feeDelete };
      }
      if (table === 'booking_invoices') {
        return { delete: invoiceDelete };
      }
      if (table === 'booking_payments') {
        return { delete: payDelete };
      }
      if (table === 'bookings') {
        return { delete: bookingDelete };
      }
      return {};
    });

    const { data, error } = await deleteBookingById('book-1');

    expect(data).toBeNull();
    expect(error?.message).toBe('RLS on payments');
    expect(bookingDelete).not.toHaveBeenCalled();
  });
});
