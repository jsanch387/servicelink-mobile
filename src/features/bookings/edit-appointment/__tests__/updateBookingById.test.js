jest.mock('../../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../../../lib/supabase';
import { updateBookingById } from '../api/updateBookingById';

function mockUpdateChain(result, { withBusinessScope = false } = {}) {
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const select = jest.fn(() => ({ maybeSingle }));
  const secondEq = jest.fn(() => ({ select }));
  const firstEq = withBusinessScope
    ? jest.fn(() => ({ eq: secondEq, select }))
    : jest.fn(() => ({ select }));
  const update = jest.fn(() => ({ eq: firstEq }));
  supabase.from.mockReturnValue({ update });
  return { update, firstEq, secondEq, select, maybeSingle };
}

describe('updateBookingById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates booking row by id', async () => {
    const chain = mockUpdateChain({ data: { id: 'book-1' }, error: null });
    const payload = { customer_name: 'Jane Doe', scheduled_date: '2026-07-15' };

    const { data, error } = await updateBookingById('book-1', payload);

    expect(error).toBeNull();
    expect(data).toEqual({ id: 'book-1' });
    expect(supabase.from).toHaveBeenCalledWith('bookings');
    expect(chain.update).toHaveBeenCalledWith(payload);
    expect(chain.firstEq).toHaveBeenCalledWith('id', 'book-1');
    expect(chain.select).toHaveBeenCalledWith('id');
  });

  it('scopes update by business_id when provided', async () => {
    const chain = mockUpdateChain(
      { data: { id: 'book-1' }, error: null },
      { withBusinessScope: true },
    );

    await updateBookingById('book-1', { customer_name: 'Jane' }, 'biz-9');

    expect(chain.firstEq).toHaveBeenCalledWith('id', 'book-1');
    expect(chain.secondEq).toHaveBeenCalledWith('business_id', 'biz-9');
  });

  it('passes through Supabase error', async () => {
    mockUpdateChain({ data: null, error: { message: 'RLS denied' } });

    const { data, error } = await updateBookingById('book-1', { customer_name: 'Jane' });

    expect(data).toBeNull();
    expect(error?.message).toBe('RLS denied');
  });
});
