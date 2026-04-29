import { supabase } from '../../../lib/supabase';

/**
 * @typedef {object} PaymentAccountRow
 * @property {string} id
 * @property {string} business_id
 * @property {string | null} stripe_account_id
 * @property {string | null} onboarding_status
 * @property {boolean | null} charges_enabled
 */

/**
 * @typedef {object} PaymentSettingsRow
 * @property {string} business_id
 * @property {boolean | null} payments_enabled
 * @property {string | null} checkout_mode
 * @property {boolean | null} deposits_enabled
 * @property {string | null} deposit_type
 * @property {number | null} deposit_value
 * @property {string | null} currency
 */

/**
 * Parallel read of `payment_accounts` + `payment_settings` for one business (one row each).
 *
 * @param {string} businessId - `business_profiles.id`
 * @returns {Promise<{ paymentAccount: PaymentAccountRow | null; paymentSettings: PaymentSettingsRow | null }>}
 */
export async function fetchPaymentDashboardRows(businessId) {
  const [acctRes, settingsRes] = await Promise.all([
    supabase
      .from('payment_accounts')
      .select('id, business_id, stripe_account_id, onboarding_status, charges_enabled')
      .eq('business_id', businessId)
      .maybeSingle(),
    supabase
      .from('payment_settings')
      .select(
        'business_id, payments_enabled, checkout_mode, deposits_enabled, deposit_type, deposit_value, currency',
      )
      .eq('business_id', businessId)
      .maybeSingle(),
  ]);

  if (acctRes.error) {
    throw new Error(acctRes.error.message ?? 'Could not load payment account');
  }
  if (settingsRes.error) {
    throw new Error(settingsRes.error.message ?? 'Could not load payment settings');
  }

  return {
    paymentAccount: acctRes.data ?? null,
    paymentSettings: settingsRes.data ?? null,
  };
}

/**
 * Stripe usable for ServiceLink checkout (matches web “Stripe ready”).
 *
 * @param {PaymentAccountRow | null} row
 */
export function isStripeConnectReady(row) {
  if (!row) return false;
  return row.onboarding_status === 'complete' && row.charges_enabled === true;
}
