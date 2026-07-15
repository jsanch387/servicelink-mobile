import { CREATE_QUOTE_STEP } from '../constants/createQuoteWizard';

/**
 * @param {boolean} detailsSkipped
 * @param {boolean} addonsSkipped
 * @param {boolean} [schedulePickIncluded] Owner is picking date/time (calendar step visible).
 */
export function getCreateQuoteVisibleStepOrder(
  detailsSkipped,
  addonsSkipped,
  schedulePickIncluded = false,
) {
  const order = [CREATE_QUOTE_STEP.CUSTOMER, CREATE_QUOTE_STEP.VEHICLE, CREATE_QUOTE_STEP.SERVICE];
  if (!detailsSkipped) order.push(CREATE_QUOTE_STEP.DETAILS);
  if (!addonsSkipped) order.push(CREATE_QUOTE_STEP.ADDONS);
  order.push(CREATE_QUOTE_STEP.SCHEDULE);
  if (schedulePickIncluded) order.push(CREATE_QUOTE_STEP.SCHEDULE_PICK);
  order.push(CREATE_QUOTE_STEP.REVIEW);
  return order;
}

/**
 * @param {number} step
 * @param {{
 *   detailsSkipped: boolean;
 *   addonsSkipped: boolean;
 *   schedulePickIncluded?: boolean;
 * }} skip
 */
export function getCreateQuoteWizardStepIndex(
  step,
  { detailsSkipped, addonsSkipped, schedulePickIncluded = false },
) {
  const order = getCreateQuoteVisibleStepOrder(detailsSkipped, addonsSkipped, schedulePickIncluded);
  const idx = order.indexOf(step);
  if (idx < 0) {
    return Math.min(order.length - 1, Math.max(0, step));
  }
  return idx;
}

/**
 * @param {{
 *   detailsSkipped: boolean;
 *   addonsSkipped: boolean;
 *   schedulePickIncluded?: boolean;
 * }} skip
 */
export function getCreateQuoteWizardStepCount({
  detailsSkipped,
  addonsSkipped,
  schedulePickIncluded = false,
}) {
  return getCreateQuoteVisibleStepOrder(detailsSkipped, addonsSkipped, schedulePickIncluded).length;
}

/**
 * @param {{
 *   step: number;
 *   detailsSkipped: boolean;
 *   addonsSkipped: boolean;
 *   schedulePickIncluded?: boolean;
 * }} p
 */
export function getNextCreateQuoteStepOnContinue({
  step,
  detailsSkipped,
  addonsSkipped,
  schedulePickIncluded = false,
}) {
  if (step === CREATE_QUOTE_STEP.SERVICE) {
    if (!detailsSkipped) return CREATE_QUOTE_STEP.DETAILS;
    if (!addonsSkipped) return CREATE_QUOTE_STEP.ADDONS;
    return CREATE_QUOTE_STEP.SCHEDULE;
  }
  if (step === CREATE_QUOTE_STEP.DETAILS) {
    return addonsSkipped ? CREATE_QUOTE_STEP.SCHEDULE : CREATE_QUOTE_STEP.ADDONS;
  }
  if (step === CREATE_QUOTE_STEP.ADDONS) {
    return CREATE_QUOTE_STEP.SCHEDULE;
  }
  if (step === CREATE_QUOTE_STEP.SCHEDULE_PICK) {
    return CREATE_QUOTE_STEP.REVIEW;
  }
  if (step === CREATE_QUOTE_STEP.SCHEDULE) {
    return schedulePickIncluded ? CREATE_QUOTE_STEP.SCHEDULE_PICK : CREATE_QUOTE_STEP.REVIEW;
  }
  return step + 1;
}

/**
 * @param {{
 *   step: number;
 *   detailsSkipped: boolean;
 *   addonsSkipped: boolean;
 *   schedulePickIncluded?: boolean;
 * }} p
 */
export function getPreviousCreateQuoteStepOnBack({
  step,
  detailsSkipped,
  addonsSkipped,
  schedulePickIncluded = false,
}) {
  if (step === CREATE_QUOTE_STEP.REVIEW) {
    if (schedulePickIncluded) return CREATE_QUOTE_STEP.SCHEDULE_PICK;
    return CREATE_QUOTE_STEP.SCHEDULE;
  }
  if (step === CREATE_QUOTE_STEP.SCHEDULE_PICK) {
    return CREATE_QUOTE_STEP.SCHEDULE;
  }
  if (step === CREATE_QUOTE_STEP.SCHEDULE) {
    if (!addonsSkipped) return CREATE_QUOTE_STEP.ADDONS;
    if (!detailsSkipped) return CREATE_QUOTE_STEP.DETAILS;
    return CREATE_QUOTE_STEP.SERVICE;
  }
  if (step === CREATE_QUOTE_STEP.ADDONS) {
    return detailsSkipped ? CREATE_QUOTE_STEP.SERVICE : CREATE_QUOTE_STEP.DETAILS;
  }
  if (step === CREATE_QUOTE_STEP.DETAILS) {
    return CREATE_QUOTE_STEP.SERVICE;
  }
  return Math.max(0, step - 1);
}

/**
 * Catalog with ≤1 pricing tier → skip details (same idea as create-appointment).
 * Custom job never skips details (needs name / price / duration).
 * While Pro price tiers are loading, do not skip yet.
 *
 * @param {{
 *   isCustomJob: boolean;
 *   pricingOptionsCount: number;
 *   priceOptionsLoading?: boolean;
 * }} p
 */
export function isCreateQuoteDetailsStepSkipped({
  isCustomJob,
  pricingOptionsCount,
  priceOptionsLoading = false,
}) {
  if (isCustomJob) return false;
  if (priceOptionsLoading) return false;
  return pricingOptionsCount <= 1;
}

/**
 * Custom job never shows add-ons. Catalog skips when the service has none.
 *
 * @param {{ isCustomJob: boolean; addonsCount: number }} p
 */
export function isCreateQuoteAddonsStepSkipped({ isCustomJob, addonsCount }) {
  if (isCustomJob) return true;
  return addonsCount === 0;
}
