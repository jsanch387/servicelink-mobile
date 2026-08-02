/** When true (and `__DEV__`), Home shows controls to preview the full Next Up job lifecycle. */
/** Dev-only: mock Next Up lifecycle on Home. Set false once real bookings cover QA. */
export const NEXT_UP_LIFECYCLE_DESIGN_PREVIEW = false;

/**
 * Dev-only: On my way / Done confirm modal shows idle / sending / success / error previews.
 * Set false when the flow is finalized.
 */
export const ON_MY_WAY_CONFIRM_DESIGN_PREVIEW = false;

/**
 * When true, Next Up uses job_status lifecycle CTAs (slide to start, done/skip, mark complete)
 * and server-backed SMS actions.
 *
 * When false, Next Up only shows **On my way** (device Messages app) and **Navigate**.
 *
 * Enabled for development now that SMS sending is approved. Hold notes:
 * `docs/NEXT_UP_SMS_HOLD.md` — delete that doc when this flag is permanently on.
 */
export const NEXT_UP_USE_JOB_LIFECYCLE_ACTIONS = true;
