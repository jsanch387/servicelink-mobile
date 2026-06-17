/** Step copy for the create-appointment wizard (UI only). */
export const CREATE_APPOINTMENT_STEP_META = [
  {
    key: 'service',
    title: 'Choose a service',
    subtitle: 'Pick what you’re booking for this appointment.',
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
  ADDRESS: 5,
  VEHICLE: 6,
  REVIEW: 7,
});

export const CREATE_APPOINTMENT_STEP_COUNT = CREATE_APPOINTMENT_STEP_META.length;

export const CREATE_APPOINTMENT_LAST_STEP = CREATE_APPOINTMENT_STEP_COUNT - 1;

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
