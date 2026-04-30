/** Step titles for the create-appointment wizard (UI only). */
export const CREATE_APPOINTMENT_STEP_META = [
  { key: 'service', title: 'Choose a service' },
  { key: 'pricing', title: 'Pricing' },
  { key: 'addons', title: 'Add-ons' },
  { key: 'schedule', title: 'Date and time' },
  { key: 'customer', title: 'Customer' },
  { key: 'address', title: 'Service address' },
  { key: 'vehicle', title: 'Vehicle' },
  { key: 'review', title: 'Review appointment' },
];

/** 0-based indices — keep in sync with {@link CREATE_APPOINTMENT_STEP_META} order. */
export const CREATE_APPOINTMENT_STEP = Object.freeze({
  SERVICE: 0,
  PRICING: 1,
  ADDONS: 2,
  SCHEDULE: 3,
  CUSTOMER: 4,
  ADDRESS: 5,
  VEHICLE: 6,
  REVIEW: 7,
});

export const CREATE_APPOINTMENT_STEP_COUNT = CREATE_APPOINTMENT_STEP_META.length;

export const CREATE_APPOINTMENT_LAST_STEP = CREATE_APPOINTMENT_STEP_COUNT - 1;

/** Pricing and add-ons steps use their own in-card headings. */
const STEPS_WITHOUT_MAIN_TITLE = new Set([
  CREATE_APPOINTMENT_STEP.PRICING,
  CREATE_APPOINTMENT_STEP.ADDONS,
]);

/**
 * @param {number} step
 */
export function createAppointmentStepShowsMainTitle(step) {
  return !STEPS_WITHOUT_MAIN_TITLE.has(step);
}

export function createEmptyCustomerForm() {
  return { fullName: '', email: '', phone: '' };
}

export function createEmptyAddressForm() {
  return { street: '', unit: '', city: '', state: '', zip: '' };
}

export function createEmptyVehicleForm() {
  return { year: '', make: '', model: '' };
}
