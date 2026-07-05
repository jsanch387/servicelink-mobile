/** When true (and `__DEV__`), Home shows controls to preview the full Next Up job lifecycle. */
/** Dev-only: mock Next Up lifecycle on Home. Set false once real bookings cover QA. */
export const NEXT_UP_LIFECYCLE_DESIGN_PREVIEW = false;

/**
 * When true, Next Up uses job_status lifecycle CTAs (slide to start, done/skip, mark complete)
 * and server-backed SMS actions.
 *
 * When false (current ship mode until server SMS is approved), Next Up only shows
 * **On my way** (opens the device Messages app with a prefilled text) and **Navigate**.
 * Lifecycle code stays in place — flip this to `true` when SMS is ready.
 *
 * Temporary hold notes (what’s hidden, what’s waiting, how to remove):
 * `docs/NEXT_UP_SMS_HOLD.md` — delete that doc when this flag is permanently on.
 */
export const NEXT_UP_USE_JOB_LIFECYCLE_ACTIONS = false;
