jest.mock('../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../../lib/supabase';
import { fetchCompletedBookingPayments } from '../api/fetchCompletedBookingPayments';

function mockBookingsQuery({ data = [], error = null } = {}) {
  const builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    lte: jest.fn(() => builder),
    order: jest.fn(() => builder),
    then: (onFulfilled, onRejected) =>
      Promise.resolve({ data, error }).then(onFulfilled, onRejected),
  };
  supabase.from.mockReturnValue(builder);
  return builder;
}

describe('fetchCompletedBookingPayments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty data without querying when businessId is missing', async () => {
    const out = await fetchCompletedBookingPayments({ businessId: '' });
    expect(out).toEqual({ data: [], error: null });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('queries completed bookings for the business ordered by schedule', async () => {
    const builder = mockBookingsQuery({
      data: [{ id: 'b1', status: 'completed' }],
    });

    const out = await fetchCompletedBookingPayments({ businessId: 'biz-1' });

    expect(supabase.from).toHaveBeenCalledWith('bookings');
    expect(builder.select).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('business_id', 'biz-1');
    expect(builder.eq).toHaveBeenCalledWith('status', 'completed');
    expect(builder.order).toHaveBeenCalledWith('scheduled_date', { ascending: true });
    expect(builder.order).toHaveBeenCalledWith('start_time', { ascending: true });
    expect(builder.gte).not.toHaveBeenCalled();
    expect(builder.lte).not.toHaveBeenCalled();
    expect(out).toEqual({ data: [{ id: 'b1', status: 'completed' }], error: null });
  });

  it('applies inclusive scheduled_date window when provided', async () => {
    const builder = mockBookingsQuery({ data: [] });

    await fetchCompletedBookingPayments({
      businessId: 'biz-1',
      fromYmd: '2026-07-01',
      toYmd: '2026-07-31',
    });

    expect(builder.gte).toHaveBeenCalledWith('scheduled_date', '2026-07-01');
    expect(builder.lte).toHaveBeenCalledWith('scheduled_date', '2026-07-31');
  });

  it('normalizes null data to an empty array', async () => {
    mockBookingsQuery({ data: null });
    const out = await fetchCompletedBookingPayments({ businessId: 'biz-1' });
    expect(out.data).toEqual([]);
  });

  it('passes through query errors', async () => {
    const err = new Error('rls denied');
    mockBookingsQuery({ data: null, error: err });
    const out = await fetchCompletedBookingPayments({ businessId: 'biz-1' });
    expect(out.error).toBe(err);
    expect(out.data).toEqual([]);
  });
});
