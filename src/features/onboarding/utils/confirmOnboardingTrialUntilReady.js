import { confirmOnboardingTrial } from '../api/confirmOnboardingTrial';
import { applyTrialConfirmationToOnboardingCache } from './applyTrialConfirmationToOnboardingCache';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {{ synced_from_checkout?: boolean; checkout_pending?: boolean; trial_confirmation?: Record<string, unknown> | null }} res
 */
function isCheckoutTrialReady(res) {
  if (res.synced_from_checkout === true) {
    return true;
  }
  if (res.checkout_pending === true) {
    return false;
  }
  const sub = res.trial_confirmation?.subscription_status;
  return sub === 'trialing' || sub === 'active';
}

/**
 * After Stripe Checkout return, call confirm until the server reports checkout sync or
 * trialing/active without pending (per web API contract).
 *
 * @param {{ accessToken: string; userId: string; checkoutSessionId: string | null; maxAttempts?: number; delayMs?: number }} args
 * @returns {Promise<{ ok: true; trial_confirmation: Record<string, unknown> | null } | { error: Error; httpStatus: number }>}
 */
export async function confirmOnboardingTrialUntilReady({
  accessToken,
  userId,
  checkoutSessionId,
  maxAttempts = 10,
  delayMs = 700,
}) {
  const params =
    checkoutSessionId && checkoutSessionId.trim()
      ? { checkout_session_id: checkoutSessionId.trim() }
      : {};

  let lastTc = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await confirmOnboardingTrial(accessToken, params);
    if ('error' in res) {
      return res;
    }
    if (res.trial_confirmation) {
      lastTc = res.trial_confirmation;
      applyTrialConfirmationToOnboardingCache(userId, res.trial_confirmation);
    }
    if (isCheckoutTrialReady(res)) {
      return { ok: true, trial_confirmation: res.trial_confirmation ?? lastTc };
    }
    if (attempt < maxAttempts - 1) {
      await sleep(delayMs);
    }
  }
  return { ok: true, trial_confirmation: lastTc };
}
