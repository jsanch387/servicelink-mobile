/** Title when Tap to Pay is tapped but payments are not configured. */
export const TAP_TO_PAY_NOT_SET_UP_TITLE = 'Payments not set up';

/** Short explanation under the title. */
export const TAP_TO_PAY_NOT_SET_UP_HINT =
  'Set up payments on ServiceLink to collect contactless payments when you complete a job. Mark as paid is always available.';

/** CTA that opens More → Payments to begin Stripe onboarding. */
export const TAP_TO_PAY_SETUP_PAYMENTS_CTA_LABEL = 'Set up payments';

/** @deprecated Use TAP_TO_PAY_SETUP_PAYMENTS_CTA_LABEL */
export const TAP_TO_PAY_GET_STARTED_LABEL = TAP_TO_PAY_SETUP_PAYMENTS_CTA_LABEL;

export const TAP_TO_PAY_SETUP_DISMISS_LABEL = 'Not now';

/** Accessibility hint when Connect is not ready. */
export const TAP_TO_PAY_SETUP_ACCESSIBILITY_HINT = 'Opens payments setup to enable Tap to Pay';

/** Accessibility hint when Connect is ready. */
export const TAP_TO_PAY_COLLECT_ACCESSIBILITY_HINT =
  'Collect the remaining balance with contactless Tap to Pay';

/**
 * Complete-visit checkout CTA when Mark as paid is also shown (Apple 5.4, US Appendix C short form).
 * Long form for US is “Tap to Pay on iPhone”; short form is approved for multi-option checkout.
 */
export const TAP_TO_PAY_CHECKOUT_BUTTON_LABEL = 'Tap to Pay';
