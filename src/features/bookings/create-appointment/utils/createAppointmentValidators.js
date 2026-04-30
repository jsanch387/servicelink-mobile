import { normalizePhoneForDatabase } from '../../../../utils/phone';

function isValidEmailFormat(email) {
  const t = String(email ?? '').trim();
  if (!t) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

/** Customer step: name, email, complete US phone (10 NANP digits). */
export function isCustomerStepComplete(customer) {
  const c = customer ?? {};
  if (!String(c.fullName ?? '').trim()) return false;
  if (!isValidEmailFormat(c.email)) return false;
  if (normalizePhoneForDatabase(c.phone ?? '') == null) return false;
  return true;
}

/** Address step: street, city, state, ZIP (unit optional). */
export function isAddressStepComplete(address) {
  const a = address ?? {};
  return Boolean(
    String(a.street ?? '').trim() &&
    String(a.city ?? '').trim() &&
    String(a.state ?? '').trim() &&
    String(a.zip ?? '').trim(),
  );
}

/** Vehicle step: year, make, model (notes optional). */
export function isVehicleStepComplete(vehicle) {
  const v = vehicle ?? {};
  return Boolean(
    String(v.year ?? '').trim() && String(v.make ?? '').trim() && String(v.model ?? '').trim(),
  );
}

/**
 * Review / confirm: everything required to book is present.
 * @param {{
 *   selectedServiceId: string | null;
 *   selectedPricingId: string | null;
 *   selectedDateKey: string | null;
 *   selectedTime: string | null;
 *   customer: object;
 *   address: object;
 *   vehicle: object;
 * }} p
 */
export function isReviewStepComplete(p) {
  return Boolean(
    p.selectedServiceId &&
    p.selectedPricingId &&
    p.selectedDateKey &&
    p.selectedTime &&
    isCustomerStepComplete(p.customer) &&
    isAddressStepComplete(p.address) &&
    isVehicleStepComplete(p.vehicle),
  );
}
