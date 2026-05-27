/**
 * App Store review sign-in: one allowlisted email can use password instead of email OTP
 * (reviewers cannot read the inbox for the one-time code).
 *
 * Set `EXPO_PUBLIC_APP_REVIEW_LOGIN_EMAIL` in `.env.local` / EAS secrets for production builds
 * submitted to Apple. Leave unset to disable the password path entirely.
 */

function normalizeEmail(email) {
  return String(email ?? '')
    .trim()
    .toLowerCase();
}

export function getAppReviewLoginEmail() {
  return normalizeEmail(process.env.EXPO_PUBLIC_APP_REVIEW_LOGIN_EMAIL);
}

export function isAppReviewLoginEnabled() {
  return Boolean(getAppReviewLoginEmail());
}

export function isAppReviewLoginEmail(email) {
  const allowlisted = getAppReviewLoginEmail();
  if (!allowlisted) {
    return false;
  }
  const candidate = normalizeEmail(email);
  return Boolean(candidate) && candidate === allowlisted;
}
