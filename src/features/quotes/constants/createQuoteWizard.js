/** @typedef {{ id: string; title: string; subtitle: string }} CreateQuoteWizardStepDef */

/** Synthetic id when quoting a job that is not in the services catalog. */
export const CREATE_QUOTE_CUSTOM_JOB_ID = '__custom_job__';

/**
 * When `true`, customer / vehicle / input steps render fields inside a `SurfaceCard`.
 * Set to `false` for the previous flat-on-shell layout (one-line revert before commit).
 */
export const CREATE_QUOTE_WRAP_INPUT_STEPS_IN_SURFACE_CARD = true;

/** Vertical gap between form fields (mobile-friendly rhythm). */
export const CREATE_QUOTE_FIELD_GAP = 20;

/**
 * Logical wizard step indices (pricing/details, add-ons, and calendar pick may be skipped).
 * @type {Readonly<{
 *   CUSTOMER: 0;
 *   VEHICLE: 1;
 *   SERVICE: 2;
 *   DETAILS: 3;
 *   ADDONS: 4;
 *   SCHEDULE: 5;
 *   SCHEDULE_PICK: 6;
 *   REVIEW: 7;
 * }>}
 */
export const CREATE_QUOTE_STEP = Object.freeze({
  CUSTOMER: 0,
  VEHICLE: 1,
  SERVICE: 2,
  DETAILS: 3,
  ADDONS: 4,
  SCHEDULE: 5,
  SCHEDULE_PICK: 6,
  REVIEW: 7,
});

/** @type {CreateQuoteWizardStepDef[]} */
export const CREATE_QUOTE_WIZARD_STEPS = [
  {
    id: 'customer',
    title: 'Who is this for?',
    subtitle: 'Customer name, email, and phone.',
  },
  {
    id: 'vehicle',
    title: 'Vehicle',
    subtitle: 'Optional — leave blank if you don’t need it.',
  },
  {
    id: 'service',
    title: "What's the job?",
    subtitle: 'Your services, or a custom job.',
  },
  {
    id: 'details',
    title: 'Job details',
    subtitle: 'Confirm pricing and duration for this quote.',
  },
  {
    id: 'addons',
    title: 'Add-ons',
    subtitle: 'Include extras, or continue without them.',
  },
  {
    id: 'schedule',
    title: 'Date and time',
    subtitle: 'Set a time now, or let them choose later.',
  },
  {
    id: 'schedule_pick',
    title: 'Choose a date',
    subtitle: 'Pick a day and start time for this quote.',
  },
  {
    id: 'review',
    title: 'Ready to send',
    subtitle: 'Check the quote, then send it.',
  },
];

/** Copy when browsing the services catalog list. */
export const CREATE_QUOTE_CATALOG_PICK_COPY = {
  title: 'Choose a service',
  subtitle: 'Pick one of your services to quote.',
};

/** Copy when details step is the custom-job form. */
export const CREATE_QUOTE_CUSTOM_DETAILS_COPY = {
  title: 'Custom job',
  subtitle: 'Name it, set a price, and estimate duration.',
};

/** Copy when details step is catalog pricing options. */
export const CREATE_QUOTE_PRICING_DETAILS_COPY = {
  title: 'Choose an option',
  subtitle: 'Pick the option that fits this quote.',
};

export const CREATE_QUOTE_WIZARD_STEP_COUNT = CREATE_QUOTE_WIZARD_STEPS.length;
