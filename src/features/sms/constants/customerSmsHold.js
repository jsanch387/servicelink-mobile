/**
 * Server-backed customer SMS (Twilio / Pingram) is on hold until provider approval.
 *
 * When false:
 * - Do not show SMS success / skip toasts (misleading — texts are not sent).
 * - Email confirmation toasts stay allowed.
 * - Device Messages deep links (e.g. On my way) are unrelated and stay available.
 *
 * Flip to `true` with `NEXT_UP_USE_JOB_LIFECYCLE_ACTIONS` and
 * `COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY` when SMS ships.
 *
 * See `src/features/home/docs/NEXT_UP_SMS_HOLD.md`.
 */
export const CUSTOMER_SMS_TOASTS_ENABLED = false;
