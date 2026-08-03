import { CUSTOMER_SMS_ENABLED } from '../../../sms/constants/customerSmsFlags';

/**
 * Mark complete rollout flags (compile-time — change in source to roll back).
 *
 * - `USE_JOB_COMPLETED_ACTION`: production path calls `POST …/actions` with `job_completed`
 *   (server orchestrates SMS + review link). When false, legacy Supabase complete + review email runs.
 * - `USE_COMPLETE_VISIT_SCREEN`: full complete-visit checkout UI (fees, mark as paid). On in production.
 * - `SHOW_COMPLETE_VISIT_DESIGN_PREVIEW`: dev Home button for complete-visit design sheet.
 */
export const MARK_COMPLETE_USE_JOB_COMPLETED_ACTION = true;

export const MARK_COMPLETE_USE_COMPLETE_VISIT_SCREEN = true;

/** When true (and `__DEV__`), Home shows "Preview complete + invoice". Set false after Cycle 2 QA. */
export const MARK_COMPLETE_SHOW_COMPLETE_VISIT_DESIGN_PREVIEW = false;

/**
 * TEMP preview — force-open the receipt contact dialog (email + phone fields) on complete sheet.
 * Set false after design check.
 */
export const FORCE_SHOW_RECEIPT_CONTACT_DIALOG = false;

/**
 * When true, complete-visit UI promises customer SMS/email (receipt + review link).
 * Tied to {@link CUSTOMER_SMS_ENABLED}.
 */
export const COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY = CUSTOMER_SMS_ENABLED;
