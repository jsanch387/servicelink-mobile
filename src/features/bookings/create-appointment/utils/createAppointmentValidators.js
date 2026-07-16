import { isValidEmailFormat } from '../../../../utils/email';
import { normalizePhoneForDatabase } from '../../../../utils/phone';
import { isCreateFlowPricingSelectionValid } from './createFlowPricing';
import { isLocationStepComplete } from './createAppointmentServiceLocation';

export function parseRequiredCustomJobPriceCents(value) {
  const raw = String(value ?? '')
    .replace(/\$/g, '')
    .trim();
  if (!raw || !/\d/.test(raw)) return null;
  const dollars = Number.parseFloat(raw);
  if (!Number.isFinite(dollars)) return null;
  const cents = Math.round(dollars * 100);
  return cents > 0 ? cents : null;
}

/** Customer step: name, complete US phone (10 NANP digits); email optional but must be valid when present. */
export function isCustomerStepComplete(customer) {
  const c = customer ?? {};
  const fullName = String(c.fullName ?? '').trim();
  if (!fullName || fullName.length > 120) return false;
  const emailTrim = String(c.email ?? '').trim();
  if (emailTrim && (emailTrim.length > 254 || !isValidEmailFormat(emailTrim))) return false;
  if (normalizePhoneForDatabase(c.phone ?? '') == null) return false;
  return true;
}

/** Address step: street, city, state, ZIP (unit optional). */
export function isAddressStepComplete(address) {
  const a = address ?? {};
  const street = String(a.street ?? '').trim();
  const unit = String(a.unit ?? '').trim();
  const city = String(a.city ?? '').trim();
  return Boolean(
    street &&
    street.length <= 200 &&
    unit.length <= 50 &&
    city &&
    city.length <= 100 &&
    /^[A-Za-z]{2}$/.test(String(a.state ?? '').trim()) &&
    /^\d{5}$/.test(String(a.zip ?? '').trim()),
  );
}

/** Vehicle is optional, but partial vehicle snapshots are rejected by the owner-booking API. */
export function isVehicleStepComplete(vehicle, now = new Date()) {
  const v = vehicle ?? {};
  const year = String(v.year ?? '').trim();
  const make = String(v.make ?? '').trim();
  const model = String(v.model ?? '').trim();
  if (!year && !make && !model) return true;
  if (!year || !make || !model || !/^\d{4}$/.test(year)) return false;
  const yearNumber = Number(year);
  return yearNumber >= 1900 && yearNumber <= now.getFullYear() + 1;
}

/**
 * Review / confirm: everything required to book is present.
 * @param {{
 *   selectedServiceId: string | null;
 *   selectedPricingId: string | null;
 *   pricingOptions?: Array<{ id: string }>;
 *   priceOptionsLoading?: boolean;
 *   priceOptionsEnabled?: boolean;
 *   selectedDateKey: string | null;
 *   selectedTime: string | null;
 *   customer: object;
 *   appointmentLocationType?: 'mobile' | 'shop' | null;
 *   locationSkipped?: boolean;
 *   addressSkipped?: boolean;
 *   address: object;
 *   vehicle: object;
 * }} p
 */
export function isReviewStepComplete(p) {
  return Boolean(
    p.selectedServiceId &&
    isCreateFlowPricingSelectionValid({
      selectedPricingId: p.selectedPricingId,
      pricingOptions: p.pricingOptions,
      priceOptionsLoading: p.priceOptionsLoading,
      priceOptionsEnabled: p.priceOptionsEnabled,
    }) &&
    p.selectedDateKey &&
    p.selectedTime &&
    isCustomerStepComplete(p.customer) &&
    (p.locationSkipped || isLocationStepComplete(p.appointmentLocationType)) &&
    (p.addressSkipped || isAddressStepComplete(p.address)) &&
    isVehicleStepComplete(p.vehicle),
  );
}
