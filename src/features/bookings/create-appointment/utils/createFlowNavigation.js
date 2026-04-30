import { CREATE_APPOINTMENT_STEP } from '../constants';

/**
 * When the catalog is loaded and the service has no add-ons, the add-ons step is skipped
 * (forward from pricing → schedule, back from schedule → pricing).
 *
 * @param {boolean} addonCatalogKnown
 * @param {number} addonsCount
 */
export function isAddonsStepSkipped(addonCatalogKnown, addonsCount) {
  return Boolean(addonCatalogKnown && addonsCount === 0);
}

/**
 * Next step when pressing Continue (not on the final submit step).
 *
 * @param {object} p
 * @param {number} p.step
 * @param {boolean} p.addonCatalogKnown
 * @param {number} p.addonsCount
 */
export function getNextStepOnContinue({ step, addonCatalogKnown, addonsCount }) {
  if (
    step === CREATE_APPOINTMENT_STEP.PRICING &&
    isAddonsStepSkipped(addonCatalogKnown, addonsCount)
  ) {
    return CREATE_APPOINTMENT_STEP.SCHEDULE;
  }
  return step + 1;
}

/**
 * Previous step when pressing Back from the schedule step (handles skipped add-ons).
 *
 * @param {object} p
 * @param {number} p.step
 * @param {boolean} p.addonCatalogKnown
 * @param {number} p.addonsCount
 */
export function getPreviousStepOnBack({ step, addonCatalogKnown, addonsCount }) {
  if (
    step === CREATE_APPOINTMENT_STEP.SCHEDULE &&
    isAddonsStepSkipped(addonCatalogKnown, addonsCount)
  ) {
    return CREATE_APPOINTMENT_STEP.PRICING;
  }
  return step - 1;
}
