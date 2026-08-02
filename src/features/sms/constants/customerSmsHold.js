/**
 * Server-backed customer SMS toasts (Twilio / Pingram).
 *
 * When false:
 * - Do not show SMS success / skip toasts (misleading — texts are not sent).
 * - Email confirmation toasts stay allowed.
 * - Device Messages deep links (e.g. On my way) are unrelated and stay available.
 *
 * Enabled with `NEXT_UP_USE_JOB_LIFECYCLE_ACTIONS` and
 * `COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY` now that SMS sending is approved.
 *
 * See `src/features/home/docs/NEXT_UP_SMS_HOLD.md`.
 */
export const CUSTOMER_SMS_TOASTS_ENABLED = true;
