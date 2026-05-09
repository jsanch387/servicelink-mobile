/** @typedef {{ id: string; title: string; subtitle: string }} CreateQuoteWizardStepDef */

/**
 * When `true`, customer / vehicle / service / schedule steps render fields inside a `SurfaceCard`.
 * Set to `false` for the previous flat-on-shell layout (one-line revert before commit).
 */
export const CREATE_QUOTE_WRAP_INPUT_STEPS_IN_SURFACE_CARD = true;

/** Vertical gap between form fields (mobile-friendly rhythm). */
export const CREATE_QUOTE_FIELD_GAP = 20;

/** @type {CreateQuoteWizardStepDef[]} */
export const CREATE_QUOTE_WIZARD_STEPS = [
  {
    id: 'customer',
    title: 'Who is this for?',
    subtitle: 'Enter the customer details for this quote.',
  },
  {
    id: 'vehicle',
    title: 'Vehicle',
    subtitle: 'Add their vehicle if you want it on the quote — or leave it blank.',
  },
  {
    id: 'service',
    title: "What's it for?",
    subtitle: 'Add the service, price, and how long it takes.',
  },
  {
    id: 'schedule',
    title: 'When is it for?',
    subtitle: 'Choose the date and start time for this job.',
  },
  {
    id: 'review',
    title: 'Ready to send',
    subtitle: 'Review everything, then send the quote.',
  },
];

export const CREATE_QUOTE_WIZARD_STEP_COUNT = CREATE_QUOTE_WIZARD_STEPS.length;
