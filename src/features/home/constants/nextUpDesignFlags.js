import { CUSTOMER_SMS_ENABLED } from '../../sms/constants/customerSmsFlags';

/** When true (and `__DEV__`), Home shows controls to preview the full Next Up job lifecycle. */
/** Dev-only: mock Next Up lifecycle on Home. Set false once real bookings cover QA. */
export const NEXT_UP_LIFECYCLE_DESIGN_PREVIEW = false;

/**
 * Dev-only: On my way / Done confirm modal shows idle / sending / success / error previews.
 * Set false when the flow is finalized.
 */
export const ON_MY_WAY_CONFIRM_DESIGN_PREVIEW = false;

/**
 * Compile-time alias of {@link CUSTOMER_SMS_ENABLED}.
 * Runtime Next Up / Job status also require Pro (or early-access email) via
 * `useCustomerSmsAccess().canUseSms`.
 *
 * When false: legacy Next Up (device Messages On my way + Navigate only).
 */
export const NEXT_UP_USE_JOB_LIFECYCLE_ACTIONS = CUSTOMER_SMS_ENABLED;

/**
 * Launch badge on Next Up **On my way** when lifecycle SMS actions are on.
 * Set false after the feature is familiar to owners.
 */
export const NEXT_UP_ON_MY_WAY_TRY_IT_BADGE = true;
