/** Step copy for the create-appointment wizard (UI only). */
export const CREATE_APPOINTMENT_CUSTOM_JOB_ID = '__custom_job__';

export const CREATE_APPOINTMENT_STEP_META = [
  {
    key: 'service',
    title: "What's the job?",
    subtitle: 'Your services, or a custom job.',
  },
  {
    key: 'pricing',
    title: 'Pricing',
    subtitle: 'Select a price tier for this service.',
  },
  {
    key: 'addons',
    title: 'Add-ons',
    subtitle: 'Add extras if the customer wants them — or skip.',
  },
  {
    key: 'schedule',
    title: 'Date and time',
    subtitle: 'Choose the date and start time for this job.',
  },
  {
    key: 'customer',
    title: "Who's it for?",
    subtitle: 'Enter who this appointment is for.',
  },
  {
    key: 'location',
    title: 'Mobile or shop',
    subtitle: 'Choose where this appointment happens.',
  },
  {
    key: 'address',
    title: 'Where is the service?',
    subtitle: 'Where will you perform the service?',
  },
  {
    key: 'vehicle',
    title: "What's the vehicle?",
    subtitle: 'Add their vehicle details — or leave blank.',
  },
  {
    key: 'review',
    title: 'Review',
    subtitle: 'Please review the appointment details.',
  },
];

/** 0-based indices — keep in sync with {@link CREATE_APPOINTMENT_STEP_META} order. */
export const CREATE_APPOINTMENT_STEP = Object.freeze({
  SERVICE: 0,
  PRICING: 1,
  ADDONS: 2,
  SCHEDULE: 3,
  CUSTOMER: 4,
  LOCATION: 5,
  ADDRESS: 6,
  VEHICLE: 7,
  REVIEW: 8,
});

export const CREATE_APPOINTMENT_STEP_COUNT = CREATE_APPOINTMENT_STEP_META.length;

export const CREATE_APPOINTMENT_LAST_STEP = CREATE_APPOINTMENT_STEP_COUNT - 1;

/** Pricing and add-ons steps use their own in-card headings (edit flow). */
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

/** Fallback copy when booking creation fails and the server returns no safe message. */
export const CREATE_APPOINTMENT_SUBMIT_ERROR_FALLBACK = 'Could not create booking. Try again.';

export function createEmptyCustomerForm() {
  return { fullName: '', email: '', phone: '' };
}

export function createEmptyAddressForm() {
  return { street: '', unit: '', city: '', state: '', zip: '' };
}

export function createEmptyVehicleForm() {
  return { year: '', make: '', model: '' };
}
