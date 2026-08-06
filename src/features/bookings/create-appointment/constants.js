import { formatPhoneForDisplay } from '../../../utils/phone';

/** Step copy for the create-appointment wizard (UI only). */
export const CREATE_APPOINTMENT_CUSTOM_JOB_ID = '__custom_job__';

/**
 * Optimized visit flow:
 * service → pricing → add-ons → customer → location → address → vehicle
 * (optional “add another job” loops) → schedule → review
 */
export const CREATE_APPOINTMENT_STEP_META = [
  {
    key: 'service',
    title: "What's the job?",
    subtitle: 'Your services, or a custom job.',
  },
  {
    key: 'pricing',
    title: 'Pricing',
    subtitle: 'Choose a price tier for this service.',
  },
  {
    key: 'addons',
    title: 'Add-ons',
    subtitle: 'Add extras if the customer wants them — or skip.',
  },
  {
    key: 'location',
    title: 'Mobile or shop',
    subtitle: 'Choose where this appointment happens.',
  },
  {
    key: 'address',
    title: 'Where is the service?',
    subtitle: 'Search for the address, then confirm the details.',
  },
  {
    key: 'vehicle',
    title: "What's the vehicle?",
    subtitle: 'Add vehicle details — or leave blank.',
  },
  {
    key: 'schedule',
    title: 'Date and time',
    subtitle: 'Choose the date and start time for this visit.',
  },
  {
    key: 'customer',
    title: "Who's it for?",
    subtitle: 'Enter who this appointment is for.',
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
  LOCATION: 3,
  ADDRESS: 4,
  VEHICLE: 5,
  SCHEDULE: 6,
  CUSTOMER: 7,
  REVIEW: 8,
});

export const CREATE_APPOINTMENT_STEP_COUNT = CREATE_APPOINTMENT_STEP_META.length;

export const CREATE_APPOINTMENT_LAST_STEP = CREATE_APPOINTMENT_STEP_COUNT - 1;

/** Max jobs in one manual visit (UI + sequential booking create). */
export const CREATE_APPOINTMENT_MAX_JOBS = 4;

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

/** Fallback copy when booking creation fails and the server returns no safe message. */
export const CREATE_APPOINTMENT_SUBMIT_ERROR_FALLBACK = 'Could not create booking. Try again.';

export function createEmptyCustomerForm() {
  return { fullName: '', email: '', phone: '' };
}

/**
 * Seeds the Customer step when "Create appointment" is launched from an existing customer's
 * profile ({@link ../../customers/screens/CustomerDetailsScreen}) so it opens already filled in.
 *
 * @param {{ fullName?: string | null; email?: string | null; phone?: string | null } | null | undefined} prefilledCustomer
 */
export function customerFormFromPrefilledCustomer(prefilledCustomer) {
  if (!prefilledCustomer) {
    return createEmptyCustomerForm();
  }
  return {
    fullName: String(prefilledCustomer.fullName ?? '').trim(),
    email: String(prefilledCustomer.email ?? '').trim(),
    phone: formatPhoneForDisplay(prefilledCustomer.phone ?? ''),
  };
}

export function createEmptyAddressForm() {
  return { street: '', unit: '', city: '', state: '', zip: '' };
}

/**
 * Seeds the Address step from a returning customer's last known booking address.
 *
 * @param {{
 *   street?: string | null;
 *   unit?: string | null;
 *   city?: string | null;
 *   state?: string | null;
 *   zip?: string | null;
 * } | null | undefined} prefilledAddress
 */
export function addressFormFromPrefilledAddress(prefilledAddress) {
  if (!prefilledAddress) {
    return createEmptyAddressForm();
  }
  const street = String(prefilledAddress.street ?? '').trim();
  if (!street) {
    return createEmptyAddressForm();
  }
  return {
    street,
    unit: String(prefilledAddress.unit ?? '').trim(),
    city: String(prefilledAddress.city ?? '').trim(),
    state: String(prefilledAddress.state ?? '')
      .trim()
      .toUpperCase()
      .slice(0, 2),
    zip: String(prefilledAddress.zip ?? '')
      .trim()
      .replace(/\D/g, '')
      .slice(0, 5),
  };
}

/**
 * @param {{ street?: string; unit?: string; city?: string; state?: string; zip?: string } | null | undefined} address
 */
export function addressFormHasStreet(address) {
  return Boolean(String(address?.street ?? '').trim());
}

export function createEmptyVehicleForm() {
  return { year: '', make: '', model: '' };
}
