import { CUSTOMER_SMS_ENABLED } from './customerSmsFlags';

/**
 * Server-backed customer SMS toasts (Twilio / Pingram).
 *
 * Tied to {@link CUSTOMER_SMS_ENABLED}. When false:
 * - Do not show SMS success / skip toasts.
 * - Email confirmation toasts stay allowed.
 * - Device Messages deep links (legacy On my way) stay available.
 *
 * See `src/features/home/docs/NEXT_UP_SMS_HOLD.md`.
 */
export const CUSTOMER_SMS_TOASTS_ENABLED = CUSTOMER_SMS_ENABLED;
