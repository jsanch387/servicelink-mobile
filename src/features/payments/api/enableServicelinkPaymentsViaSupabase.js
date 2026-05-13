import { supabase } from '../../../lib/supabase';

/**
 * Creates the first `payment_settings` row after Stripe is ready (mobile “Turn on payments” gate).
 * `payments_enabled` stays **false** until the user turns checkout on with the toggle on the next screen.
 * Uses the signed-in Supabase session (RLS) instead of `POST /api/payments/servicelink/enable`,
 * which may return 401 when the web app only validates cookie sessions.
 *
 * @param {{ businessId: string; paymentAccountId: string }} args
 * @returns {Promise<{ ok: true } | { error: Error; httpStatus: number }>}
 */
export async function enableServicelinkPaymentsViaSupabase({ businessId, paymentAccountId }) {
  if (!businessId) {
    return { error: new Error('Missing business'), httpStatus: 400 };
  }
  if (!paymentAccountId) {
    return {
      error: new Error('Missing payment account. Finish Stripe Connect first.'),
      httpStatus: 400,
    };
  }

  /**
   * Gate CTA only **creates** the row and links `payment_account_id`. Deposit columns match table defaults;
   * ServiceLink checkout stays off (`payments_enabled` false) until the main screen toggle.
   * CHECKs: `checkout_mode` ∈ {in_person, in_app, customer_choice}; `currency` ~ ^[a-z]{3}$;
   * `deposit_value` 0–1_000_000 for fixed. Omitted columns use DB defaults (`id`, timestamps, etc.).
   */
  const row = {
    business_id: businessId,
    payment_account_id: paymentAccountId,
    payments_enabled: false,
    checkout_mode: 'customer_choice',
    deposits_enabled: true,
    deposit_type: 'fixed',
    deposit_value: 0,
    collect_remaining_balance: true,
    currency: 'usd',
  };

  const { data, error } = await supabase
    .from('payment_settings')
    .insert(row)
    .select(
      'business_id, payments_enabled, checkout_mode, deposits_enabled, deposit_type, deposit_value, currency, collect_remaining_balance',
    )
    .maybeSingle();

  if (!error) {
    return data ? { ok: true } : { error: new Error('Invalid response'), httpStatus: 500 };
  }

  /** Unique violation: row already exists (race or retry). */
  if (error.code === '23505') {
    const { data: updated, error: updateError } = await supabase
      .from('payment_settings')
      .update({
        payment_account_id: paymentAccountId,
      })
      .eq('business_id', businessId)
      .select(
        'business_id, payments_enabled, checkout_mode, deposits_enabled, deposit_type, deposit_value, currency, collect_remaining_balance',
      )
      .maybeSingle();

    if (updateError) {
      return {
        error: new Error(updateError.message ?? 'Could not turn on payments'),
        httpStatus: 500,
      };
    }
    return updated
      ? { ok: true }
      : { error: new Error('Could not turn on payments'), httpStatus: 500 };
  }

  return {
    error: new Error(error.message ?? 'Could not turn on payments'),
    httpStatus: 500,
  };
}
