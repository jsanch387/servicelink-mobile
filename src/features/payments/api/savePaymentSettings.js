import { supabase } from '../../../lib/supabase';
import { buildDepositSavePayload } from '../utils/depositAmountModel';
import { mapUiCheckoutMethodToCheckoutMode } from '../utils/paymentSettingsMaps';
import { buildTaxSettingsPatch } from '../utils/taxRateModel';

/**
 * Persists ServiceLink checkout + deposit fields on `payment_settings` (one row per `business_id`).
 * Mirrors web PATCH fields on `payment_settings`. (Web may also set `payment_account_id` when enabling
 * checkout; add that here once your row includes it and RLS allows updates.)
 *
 * @param {{
 *   businessId: string;
 *   currency: string | null | undefined;
 *   paymentsEnabled: boolean;
 *   selectedMethodId: string;
 *   requireDeposits: boolean;
 *   depositAmount: string;
 *   depositMode: string;
 *   collectTax?: boolean;
 *   taxRate?: string;
 * }} args
 * @returns {Promise<{ data: object | null; error: Error | null }>}
 */
export async function updatePaymentSettingsRow({
  businessId,
  currency,
  paymentsEnabled,
  selectedMethodId,
  requireDeposits,
  depositAmount,
  depositMode,
  collectTax,
  taxRate,
}) {
  const deposit = buildDepositSavePayload({
    depositsEnabled: requireDeposits,
    depositMode,
    depositAmount,
  });

  const tax = buildTaxSettingsPatch({ collectTax, taxRate });
  if (tax.error) {
    return { data: null, error: tax.error };
  }

  const patch = {
    payments_enabled: Boolean(paymentsEnabled),
    checkout_mode: mapUiCheckoutMethodToCheckoutMode(selectedMethodId),
    deposits_enabled: Boolean(requireDeposits),
    deposit_type: deposit.depositType,
    deposit_value: deposit.depositValue,
    currency: (
      String(currency ?? 'usd')
        .trim()
        .toLowerCase() || 'usd'
    ).slice(0, 8),
    ...tax.fields,
  };

  const { data, error } = await supabase
    .from('payment_settings')
    .update(patch)
    .eq('business_id', businessId)
    .select(
      'business_id, payments_enabled, checkout_mode, deposits_enabled, deposit_type, deposit_value, currency, tax_enabled, tax_rate_bps',
    )
    .maybeSingle();

  if (error) {
    return { data: null, error: new Error(error.message ?? 'Could not save payment settings') };
  }
  if (!data) {
    return {
      data: null,
      error: new Error(
        'No payment settings row to update. Turn on ServiceLink checkout on the web first.',
      ),
    };
  }

  return { data, error: null };
}
