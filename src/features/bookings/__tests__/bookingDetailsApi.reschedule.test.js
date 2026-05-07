jest.mock('../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../../lib/supabase';
import { rescheduleBookingById } from '../booking-details/api/bookingDetails';

function mockRescheduleChain(result) {
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const select = jest.fn(() => ({ maybeSingle }));
  const eq = jest.fn(() => ({ select }));
  const update = jest.fn(() => ({ eq }));
  supabase.from.mockReturnValue({ update });
  return { update, eq, select, maybeSingle };
}

describe('rescheduleBookingById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates scheduled_date and start_time for booking id', async () => {
    const chain = mockRescheduleChain({
      data: { id: 'book-1', scheduled_date: '2026-05-12', start_time: '13:30:00' },
      error: null,
    });

    const payload = { scheduledDate: '2026-05-12', startTime: '13:30:00' };
    const { data, error } = await rescheduleBookingById('book-1', payload);

    expect(error).toBeNull();
    expect(data).toEqual({
      id: 'book-1',
      scheduled_date: '2026-05-12',
      start_time: '13:30:00',
    });
    expect(supabase.from).toHaveBeenCalledWith('bookings');

    expect(chain.update).toHaveBeenCalledWith({
      scheduled_date: '2026-05-12',
      start_time: '13:30:00',
    });
    expect(chain.eq).toHaveBeenCalledWith('id', 'book-1');
    expect(chain.select).toHaveBeenCalledWith('id, scheduled_date, start_time');
    expect(chain.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it('passes through Supabase error', async () => {
    mockRescheduleChain({
      data: null,
      error: { message: 'RLS denied' },
    });

    const { data, error } = await rescheduleBookingById('book-1', {
      scheduledDate: '2026-05-12',
      startTime: '13:30:00',
    });

    expect(data).toBeNull();
    expect(error?.message).toBe('RLS denied');
  });
});
