jest.mock('../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../../lib/supabase';
import { updatePaymentSettingsRow } from '../api/savePaymentSettings';
import { CUSTOMER_PAYMENT_METHOD } from '../constants/customerPaymentMethods';
import { DEPOSIT_AMOUNT_MODE } from '../constants/depositAmount';

function mockUpdateChain(result) {
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const select = jest.fn(() => ({ maybeSingle }));
  const eq = jest.fn(() => ({ select }));
  const update = jest.fn(() => ({ eq }));
  supabase.from.mockReturnValue({ update });
  return { update, eq, select, maybeSingle };
}

describe('updatePaymentSettingsRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends mapped patch to payment_settings', async () => {
    mockUpdateChain({
      data: { business_id: 'b1', payments_enabled: true },
      error: null,
    });

    const { data, error } = await updatePaymentSettingsRow({
      businessId: 'b1',
      currency: 'USD',
      paymentsEnabled: true,
      selectedMethodId: CUSTOMER_PAYMENT_METHOD.IN_APP_ONLY,
      requireDeposits: true,
      depositAmount: '10',
      depositMode: DEPOSIT_AMOUNT_MODE.FIXED,
    });

    expect(error).toBeNull();
    expect(data).toEqual({ business_id: 'b1', payments_enabled: true });
    expect(supabase.from).toHaveBeenCalledWith('payment_settings');
    const { update } = supabase.from.mock.results[0].value;
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        payments_enabled: true,
        checkout_mode: 'in_app',
        deposits_enabled: true,
        deposit_type: 'fixed',
        deposit_value: 1000,
        currency: 'usd',
      }),
    );
  });

  it('returns error when Supabase returns error', async () => {
    mockUpdateChain({ data: null, error: { message: 'RLS denied' } });

    const { data, error } = await updatePaymentSettingsRow({
      businessId: 'b1',
      currency: 'usd',
      paymentsEnabled: false,
      selectedMethodId: CUSTOMER_PAYMENT_METHOD.CUSTOMER_CHOOSES,
      requireDeposits: false,
      depositAmount: '0',
      depositMode: DEPOSIT_AMOUNT_MODE.PERCENTAGE,
    });

    expect(data).toBeNull();
    expect(error?.message).toBe('RLS denied');
  });

  it('returns error when no row updated', async () => {
    mockUpdateChain({ data: null, error: null });

    const { data, error } = await updatePaymentSettingsRow({
      businessId: 'b1',
      currency: 'usd',
      paymentsEnabled: true,
      selectedMethodId: CUSTOMER_PAYMENT_METHOD.IN_PERSON_ONLY,
      requireDeposits: false,
      depositAmount: '5',
      depositMode: DEPOSIT_AMOUNT_MODE.PERCENTAGE,
    });

    expect(data).toBeNull();
    expect(error?.message).toMatch(/No payment settings row/);
  });

  it('writes the shop tax rate when collection is on', async () => {
    mockUpdateChain({
      data: { business_id: 'b1', tax_enabled: true, tax_rate_bps: 825 },
      error: null,
    });

    const { error } = await updatePaymentSettingsRow({
      businessId: 'b1',
      currency: 'usd',
      paymentsEnabled: true,
      selectedMethodId: CUSTOMER_PAYMENT_METHOD.CUSTOMER_CHOOSES,
      requireDeposits: false,
      depositAmount: '0',
      depositMode: DEPOSIT_AMOUNT_MODE.PERCENTAGE,
      collectTax: true,
      taxRate: '8.25',
    });

    expect(error).toBeNull();
    const { update } = supabase.from.mock.results[0].value;
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        tax_enabled: true,
        tax_rate_bps: 825,
      }),
    );
  });

  it('turns tax off without writing a new rate', async () => {
    mockUpdateChain({
      data: { business_id: 'b1', tax_enabled: false, tax_rate_bps: 825 },
      error: null,
    });

    await updatePaymentSettingsRow({
      businessId: 'b1',
      currency: 'usd',
      paymentsEnabled: true,
      selectedMethodId: CUSTOMER_PAYMENT_METHOD.CUSTOMER_CHOOSES,
      requireDeposits: false,
      depositAmount: '0',
      depositMode: DEPOSIT_AMOUNT_MODE.PERCENTAGE,
      collectTax: false,
      taxRate: '2.25',
    });

    const { update } = supabase.from.mock.results[0].value;
    const patch = update.mock.calls[0][0];
    expect(patch.tax_enabled).toBe(false);
    expect(patch).not.toHaveProperty('tax_rate_bps');
  });

  it('does not write tax_enabled true when the rate is empty', async () => {
    const { data, error } = await updatePaymentSettingsRow({
      businessId: 'b1',
      currency: 'usd',
      paymentsEnabled: true,
      selectedMethodId: CUSTOMER_PAYMENT_METHOD.CUSTOMER_CHOOSES,
      requireDeposits: false,
      depositAmount: '0',
      depositMode: DEPOSIT_AMOUNT_MODE.PERCENTAGE,
      collectTax: true,
      taxRate: '',
    });

    expect(data).toBeNull();
    expect(error?.message).toMatch(/0\.01%/);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
