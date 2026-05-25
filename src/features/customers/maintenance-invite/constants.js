/** @typedef {{ id: string; title: string; subtitle: string }} MaintenanceInviteWizardStepDef */

/** Vertical gap between form fields (mobile-friendly rhythm). */
export const MAINTENANCE_INVITE_FIELD_GAP = 20;

/** Max digits in price input (excluding `$`). */
export const MAINTENANCE_PRICE_INPUT_MAX = 8;

export const MAINTENANCE_DEFAULT_DURATION_HH_MM = '01:00';
export const MAINTENANCE_DEFAULT_PREFERRED_TIME = '10:00 AM';

export const MAINTENANCE_INVITE_WRAP_INPUT_STEPS_IN_SURFACE_CARD = true;

/** @type {MaintenanceInviteWizardStepDef[]} */
export const MAINTENANCE_INVITE_WIZARD_STEPS = [
  {
    id: 'plan',
    title: 'Service details',
    subtitle: 'Add the price and how long the service takes.',
  },
  {
    id: 'schedule',
    title: 'Date and time',
    subtitle:
      'Optional. Pick an open slot below, or leave it blank and your customer will choose from their link.',
  },
  {
    id: 'review',
    title: 'Ready to send',
    subtitle: 'Make sure everything looks right, then send the offer.',
  },
];

export const MAINTENANCE_INVITE_WIZARD_STEP_COUNT = MAINTENANCE_INVITE_WIZARD_STEPS.length;

/** Review step when owner skipped date and time on the schedule step. */
export const MAINTENANCE_INVITE_REVIEW_NO_SCHEDULE_COPY =
  'No date or time chosen. Your customer will pick from their link.';

export const MAINTENANCE_INVITE_SCHEDULE_AVAILABILITY_HINT =
  'Only your open days and times are shown.';
