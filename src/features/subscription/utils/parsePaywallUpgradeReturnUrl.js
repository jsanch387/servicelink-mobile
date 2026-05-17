import * as Linking from 'expo-linking';

/**
 * Stripe mobile upgrade return URLs use `?result=success` or `?result=cancel` on
 * `servicelinkmobile://paywall/stripe` (see server `STRIPE_MOBILE_UPGRADE_*_URL`).
 *
 * @param {{ type?: string; url?: string } | null | undefined} authResult - `openAuthSessionAsync` result
 * @returns {'success' | 'cancel' | null}
 */
export function parsePaywallUpgradeReturnResult(authResult) {
  if (authResult?.type !== 'success' || !authResult.url) {
    return null;
  }
  try {
    const parsed = Linking.parse(String(authResult.url).trim());
    const raw = parsed.queryParams?.result;
    const result = Array.isArray(raw) ? String(raw[0] ?? '') : String(raw ?? '');
    const normalized = result.trim().toLowerCase();
    if (normalized === 'success') {
      return 'success';
    }
    if (normalized === 'cancel') {
      return 'cancel';
    }
    return 'success';
  } catch {
    return 'success';
  }
}
