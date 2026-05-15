import { CREATE_APPOINTMENT_STEP, CREATE_APPOINTMENT_STEP_META } from '../constants';

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
 * Linear order of wizard step indices with optional pricing / add-ons removed.
 * @param {boolean} pricingSkipped
 * @param {boolean} addonsSkipped
 */
export function getCreateAppointmentVisibleStepOrder(pricingSkipped, addonsSkipped) {
  const o = [CREATE_APPOINTMENT_STEP.SERVICE];
  if (!pricingSkipped) o.push(CREATE_APPOINTMENT_STEP.PRICING);
  if (!addonsSkipped) o.push(CREATE_APPOINTMENT_STEP.ADDONS);
  o.push(
    CREATE_APPOINTMENT_STEP.SCHEDULE,
    CREATE_APPOINTMENT_STEP.CUSTOMER,
    CREATE_APPOINTMENT_STEP.ADDRESS,
    CREATE_APPOINTMENT_STEP.VEHICLE,
    CREATE_APPOINTMENT_STEP.REVIEW,
  );
  return o;
}

/**
 * Progress 0–1 for the progress bar when some steps are skipped.
 */
export function getCreateAppointmentProgressFraction(
  step,
  { appointmentConfirmed, pricingSkipped, addonsSkipped },
) {
  if (appointmentConfirmed) return 1;
  const order = getCreateAppointmentVisibleStepOrder(pricingSkipped, addonsSkipped);
  const idx = order.indexOf(step);
  if (idx < 0) {
    return Math.min(1, (step + 1) / CREATE_APPOINTMENT_STEP_META.length);
  }
  return (idx + 1) / order.length;
}

/**
 * Next step when pressing Continue (not on the final submit step).
 *
 * @param {object} p
 * @param {number} p.step
 * @param {boolean} p.addonsSkipped — {@link isAddonsStepSkipped}
 * @param {boolean} p.pricingSkipped — {@link shouldSkipCreateFlowPricingStep}
 */
export function getNextStepOnContinue({ step, addonsSkipped, pricingSkipped }) {
  if (step === CREATE_APPOINTMENT_STEP.SERVICE) {
    if (pricingSkipped) {
      return addonsSkipped ? CREATE_APPOINTMENT_STEP.SCHEDULE : CREATE_APPOINTMENT_STEP.ADDONS;
    }
    return CREATE_APPOINTMENT_STEP.PRICING;
  }

  if (step === CREATE_APPOINTMENT_STEP.PRICING) {
    return addonsSkipped ? CREATE_APPOINTMENT_STEP.SCHEDULE : CREATE_APPOINTMENT_STEP.ADDONS;
  }

  return step + 1;
}

/**
 * Previous step when pressing Back (handles skipped pricing and add-ons).
 *
 * @param {object} p
 * @param {number} p.step
 * @param {boolean} p.addonsSkipped
 * @param {boolean} p.pricingSkipped
 */
export function getPreviousStepOnBack({ step, addonsSkipped, pricingSkipped }) {
  if (step === CREATE_APPOINTMENT_STEP.SCHEDULE) {
    if (!addonsSkipped) {
      return CREATE_APPOINTMENT_STEP.ADDONS;
    }
    if (!pricingSkipped) {
      return CREATE_APPOINTMENT_STEP.PRICING;
    }
    return CREATE_APPOINTMENT_STEP.SERVICE;
  }

  if (step === CREATE_APPOINTMENT_STEP.ADDONS) {
    if (!pricingSkipped) {
      return CREATE_APPOINTMENT_STEP.PRICING;
    }
    return CREATE_APPOINTMENT_STEP.SERVICE;
  }

  return step - 1;
}
