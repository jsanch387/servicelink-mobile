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
    subtitle: 'Suggest a time, or skip—they can pick from the link.',
  },
  {
    id: 'review',
    title: 'Ready to send',
    subtitle: 'Make sure everything looks right, then send the offer.',
  },
];

export const MAINTENANCE_INVITE_WIZARD_STEP_COUNT = MAINTENANCE_INVITE_WIZARD_STEPS.length;
