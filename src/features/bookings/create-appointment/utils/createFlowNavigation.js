import { CREATE_APPOINTMENT_STEP } from '../constants';

/**
 * When the catalog is loaded and the service has no add-ons, the add-ons step is skipped.
 *
 * @param {boolean} addonCatalogKnown
 * @param {number} addonsCount
 */
export function isAddonsStepSkipped(addonCatalogKnown, addonsCount) {
  return Boolean(addonCatalogKnown && addonsCount === 0);
}

/**
 * After add-ons on job 1: customer → location → address → vehicle.
 * Job 2+: straight to vehicle (visit who/where already set).
 *
 * @param {{
 *   locationSkipped?: boolean;
 *   addressSkipped?: boolean;
 *   jobIndex?: number;
 * }} p
 */
export function getStepAfterAddons({
  locationSkipped = false,
  addressSkipped = false,
  jobIndex = 0,
}) {
  if (jobIndex > 0) {
    return CREATE_APPOINTMENT_STEP.VEHICLE;
  }
  return CREATE_APPOINTMENT_STEP.CUSTOMER;
}

/**
 * After customer on job 1: location → address → vehicle.
 */
export function getStepAfterCustomer({ locationSkipped = false, addressSkipped = false }) {
  if (!locationSkipped) return CREATE_APPOINTMENT_STEP.LOCATION;
  if (!addressSkipped) return CREATE_APPOINTMENT_STEP.ADDRESS;
  return CREATE_APPOINTMENT_STEP.VEHICLE;
}

/**
 * Linear order of wizard step indices with optional steps removed.
 *
 * Visit flow: service → pricing → add-ons → customer → location → address → vehicle
 * → (add another job loops) → schedule → review
 *
 * @param {boolean} pricingSkipped
 * @param {boolean} addonsSkipped
 * @param {boolean} [locationSkipped]
 * @param {boolean} [addressSkipped]
 * @param {number} [jobIndex] committed jobs before the current draft (0 = first job)
 */
export function getCreateAppointmentVisibleStepOrder(
  pricingSkipped,
  addonsSkipped,
  locationSkipped = false,
  addressSkipped = false,
  jobIndex = 0,
) {
  const o = [CREATE_APPOINTMENT_STEP.SERVICE];
  if (!pricingSkipped) o.push(CREATE_APPOINTMENT_STEP.PRICING);
  if (!addonsSkipped) o.push(CREATE_APPOINTMENT_STEP.ADDONS);
  if (jobIndex === 0) {
    o.push(CREATE_APPOINTMENT_STEP.CUSTOMER);
    if (!locationSkipped) o.push(CREATE_APPOINTMENT_STEP.LOCATION);
    if (!addressSkipped) o.push(CREATE_APPOINTMENT_STEP.ADDRESS);
  }
  o.push(CREATE_APPOINTMENT_STEP.VEHICLE);
  // Schedule once after vehicles are set (first pass only in the linear order).
  if (jobIndex === 0) {
    o.push(CREATE_APPOINTMENT_STEP.SCHEDULE);
  }
  o.push(CREATE_APPOINTMENT_STEP.REVIEW);
  return o;
}

/**
 * 0-based index within the visible wizard steps.
 */
export function getCreateAppointmentWizardStepIndex(
  step,
  { pricingSkipped, addonsSkipped, locationSkipped = false, addressSkipped = false, jobIndex = 0 },
) {
  const order = getCreateAppointmentVisibleStepOrder(
    pricingSkipped,
    addonsSkipped,
    locationSkipped,
    addressSkipped,
    jobIndex,
  );
  const idx = order.indexOf(step);
  if (idx < 0) {
    return Math.min(order.length - 1, Math.max(0, step));
  }
  return idx;
}

/**
 * @param {{
 *   pricingSkipped: boolean;
 *   addonsSkipped: boolean;
 *   locationSkipped?: boolean;
 *   addressSkipped?: boolean;
 *   jobIndex?: number;
 * }} p
 */
export function getCreateAppointmentWizardStepCount({
  pricingSkipped,
  addonsSkipped,
  locationSkipped = false,
  addressSkipped = false,
  jobIndex = 0,
}) {
  return getCreateAppointmentVisibleStepOrder(
    pricingSkipped,
    addonsSkipped,
    locationSkipped,
    addressSkipped,
    jobIndex,
  ).length;
}

/**
 * Progress 0–1 for the progress bar when some steps are skipped.
 */
export function getCreateAppointmentProgressFraction(
  step,
  {
    appointmentConfirmed,
    pricingSkipped,
    addonsSkipped,
    locationSkipped = false,
    addressSkipped = false,
    jobIndex = 0,
  },
) {
  if (appointmentConfirmed) return 1;
  const stepCount = getCreateAppointmentWizardStepCount({
    pricingSkipped,
    addonsSkipped,
    locationSkipped,
    addressSkipped,
    jobIndex,
  });
  const stepIndex = getCreateAppointmentWizardStepIndex(step, {
    pricingSkipped,
    addonsSkipped,
    locationSkipped,
    addressSkipped,
    jobIndex,
  });
  return (stepIndex + 1) / stepCount;
}

/**
 * Next step when pressing Continue (not on the final submit step).
 *
 * @param {object} p
 * @param {number} p.step
 * @param {boolean} p.addonsSkipped
 * @param {boolean} p.pricingSkipped
 * @param {boolean} [p.locationSkipped]
 * @param {boolean} [p.addressSkipped]
 * @param {number} [p.jobIndex]
 * @param {boolean} [p.hasScheduleSlot] date + time already chosen for this visit
 */
export function getNextStepOnContinue({
  step,
  addonsSkipped,
  pricingSkipped,
  locationSkipped = false,
  addressSkipped = false,
  jobIndex = 0,
  hasScheduleSlot = false,
}) {
  const afterAddons = () => getStepAfterAddons({ locationSkipped, addressSkipped, jobIndex });
  const afterCustomer = () => getStepAfterCustomer({ locationSkipped, addressSkipped });

  if (step === CREATE_APPOINTMENT_STEP.SERVICE) {
    if (pricingSkipped) {
      return addonsSkipped ? afterAddons() : CREATE_APPOINTMENT_STEP.ADDONS;
    }
    return CREATE_APPOINTMENT_STEP.PRICING;
  }

  if (step === CREATE_APPOINTMENT_STEP.PRICING) {
    return addonsSkipped ? afterAddons() : CREATE_APPOINTMENT_STEP.ADDONS;
  }

  if (step === CREATE_APPOINTMENT_STEP.ADDONS) {
    return afterAddons();
  }

  if (step === CREATE_APPOINTMENT_STEP.CUSTOMER) {
    return afterCustomer();
  }

  if (step === CREATE_APPOINTMENT_STEP.LOCATION) {
    return addressSkipped ? CREATE_APPOINTMENT_STEP.VEHICLE : CREATE_APPOINTMENT_STEP.ADDRESS;
  }

  if (step === CREATE_APPOINTMENT_STEP.ADDRESS) {
    return CREATE_APPOINTMENT_STEP.VEHICLE;
  }

  if (step === CREATE_APPOINTMENT_STEP.VEHICLE) {
    // Stack jobs on the vehicle step first; schedule once when the visit has no time yet.
    return hasScheduleSlot ? CREATE_APPOINTMENT_STEP.REVIEW : CREATE_APPOINTMENT_STEP.SCHEDULE;
  }

  if (step === CREATE_APPOINTMENT_STEP.SCHEDULE) {
    return CREATE_APPOINTMENT_STEP.REVIEW;
  }

  return step + 1;
}

/**
 * Previous step when pressing Back.
 *
 * @param {object} p
 * @param {number} p.step
 * @param {boolean} p.addonsSkipped
 * @param {boolean} p.pricingSkipped
 * @param {boolean} [p.locationSkipped]
 * @param {boolean} [p.addressSkipped]
 * @param {number} [p.jobIndex]
 */
export function getPreviousStepOnBack({
  step,
  addonsSkipped,
  pricingSkipped,
  locationSkipped = false,
  addressSkipped = false,
  jobIndex = 0,
}) {
  if (step === CREATE_APPOINTMENT_STEP.SCHEDULE) {
    return CREATE_APPOINTMENT_STEP.VEHICLE;
  }

  if (step === CREATE_APPOINTMENT_STEP.REVIEW) {
    // Prefer schedule when it was part of this visit pass; else vehicle.
    return jobIndex > 0 ? CREATE_APPOINTMENT_STEP.VEHICLE : CREATE_APPOINTMENT_STEP.SCHEDULE;
  }

  if (step === CREATE_APPOINTMENT_STEP.VEHICLE) {
    if (jobIndex > 0) {
      if (!addonsSkipped) return CREATE_APPOINTMENT_STEP.ADDONS;
      if (!pricingSkipped) return CREATE_APPOINTMENT_STEP.PRICING;
      return CREATE_APPOINTMENT_STEP.SERVICE;
    }
    if (!addressSkipped) return CREATE_APPOINTMENT_STEP.ADDRESS;
    if (!locationSkipped) return CREATE_APPOINTMENT_STEP.LOCATION;
    return CREATE_APPOINTMENT_STEP.CUSTOMER;
  }

  if (step === CREATE_APPOINTMENT_STEP.ADDRESS) {
    if (!locationSkipped) return CREATE_APPOINTMENT_STEP.LOCATION;
    return CREATE_APPOINTMENT_STEP.CUSTOMER;
  }

  if (step === CREATE_APPOINTMENT_STEP.LOCATION) {
    return CREATE_APPOINTMENT_STEP.CUSTOMER;
  }

  if (step === CREATE_APPOINTMENT_STEP.CUSTOMER) {
    if (!addonsSkipped) return CREATE_APPOINTMENT_STEP.ADDONS;
    if (!pricingSkipped) return CREATE_APPOINTMENT_STEP.PRICING;
    return CREATE_APPOINTMENT_STEP.SERVICE;
  }

  if (step === CREATE_APPOINTMENT_STEP.ADDONS) {
    if (!pricingSkipped) return CREATE_APPOINTMENT_STEP.PRICING;
    return CREATE_APPOINTMENT_STEP.SERVICE;
  }

  return step - 1;
}
