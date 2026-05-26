/** App Store 3.1.1 — mobile is sign-in only; accounts are created on web. */
export const NO_EXISTING_SERVICELINK_ACCOUNT_CODE = 'NO_EXISTING_SERVICELINK_ACCOUNT';

/** Login screen headline. */
export const LOGIN_SCREEN_TITLE = 'Sign in';

/** Login screen subtitle (under logo). */
export const LOGIN_SCREEN_SUBTITLE = 'Enter your email to receive a login code.';

/**
 * Login footer — informational only (not a link; App Store 3.1.1).
 * Points new users to the website without in-app registration or external browser handoff.
 */
export const LOGIN_SCREEN_NO_ACCOUNT_NOTE =
  "Don't have an account? Visit myservicelink.app in a web browser to get started.";

/** Short headline for login form errors. */
export const NO_EXISTING_SERVICELINK_ACCOUNT_TITLE = 'No account for this email';

/** Muted subtext under the no-account error (App Store 3.1.1 — no in-app registration). */
export const NO_EXISTING_SERVICELINK_ACCOUNT_HINT =
  'Use the email for your ServiceLink web account.';

/** @deprecated Use {@link NO_EXISTING_SERVICELINK_ACCOUNT_TITLE}. */
export const NO_EXISTING_SERVICELINK_ACCOUNT_MESSAGE = NO_EXISTING_SERVICELINK_ACCOUNT_TITLE;

/** Shown on login after send-code succeeds (anti-enumeration). */
export const LOGIN_CODE_SENT_MESSAGE =
  'If an account exists for this email, we sent a login code. Check your inbox.';

/** Enter-code screen — short, scannable copy. */
export const LOGIN_CODE_SCREEN_TITLE = 'Enter your login code';

export const LOGIN_CODE_SPAM_HINT = "Can't find it? Check your spam folder.";

export const LOGIN_CODE_DIGIT_COUNT = 6;

/** @param {string} email */
export function formatLoginCodeScreenSubtitle(email) {
  const trimmed = String(email ?? '').trim();
  if (!trimmed) {
    return `We sent a ${LOGIN_CODE_DIGIT_COUNT}-digit login code to your email.`;
  }
  return `We sent a ${LOGIN_CODE_DIGIT_COUNT}-digit login code to ${trimmed}`;
}
