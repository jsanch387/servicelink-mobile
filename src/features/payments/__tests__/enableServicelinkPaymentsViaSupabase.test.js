jest.mock('../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../../lib/supabase';
import { enableServicelinkPaymentsViaSupabase } from '../api/enableServicelinkPaymentsViaSupabase';

describe('enableServicelinkPaymentsViaSupabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when payment account id is missing', async () => {
    const out = await enableServicelinkPaymentsViaSupabase({
      businessId: 'b1',
      paymentAccountId: '',
    });
    expect('error' in out && out.error).toBeTruthy();
    expect(out.error.message).toMatch(/Missing payment account/);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('inserts payment_settings on success', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: { business_id: 'b1', payments_enabled: false },
      error: null,
    });
    const select = jest.fn(() => ({ maybeSingle }));
    const insert = jest.fn(() => ({ select }));
    supabase.from.mockReturnValue({ insert });

    const out = await enableServicelinkPaymentsViaSupabase({
      businessId: 'b1',
      paymentAccountId: 'pa-1',
    });

    expect('ok' in out && out.ok).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('payment_settings');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        business_id: 'b1',
        payment_account_id: 'pa-1',
        payments_enabled: false,
        checkout_mode: 'customer_choice',
        deposits_enabled: true,
        deposit_type: 'fixed',
        deposit_value: 0,
        collect_remaining_balance: true,
        currency: 'usd',
      }),
    );
  });

  it('updates when insert hits unique constraint', async () => {
    const maybeSingleInsert = jest.fn().mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key' },
    });
    const maybeSingleUpdate = jest.fn().mockResolvedValue({
      data: { business_id: 'b1', payments_enabled: false },
      error: null,
    });
    const selectInsert = jest.fn(() => ({ maybeSingle: maybeSingleInsert }));
    const selectUpdate = jest.fn(() => ({ maybeSingle: maybeSingleUpdate }));
    const eq = jest.fn(() => ({ select: selectUpdate }));
    const update = jest.fn(() => ({ eq }));
    const insert = jest.fn(() => ({ select: selectInsert }));

    supabase.from.mockReturnValueOnce({ insert }).mockReturnValueOnce({ update });

    const out = await enableServicelinkPaymentsViaSupabase({
      businessId: 'b1',
      paymentAccountId: 'pa-1',
    });

    expect('ok' in out && out.ok).toBe(true);
    expect(update).toHaveBeenCalledWith({
      payment_account_id: 'pa-1',
    });
    expect(eq).toHaveBeenCalledWith('business_id', 'b1');
  });
});
