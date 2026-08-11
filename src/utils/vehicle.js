/** Matches server `BOOKING_VEHICLE_*` in bookingCustomerFieldLimits. */
export const BOOKING_VEHICLE_MAKE_MAX = 80;
export const BOOKING_VEHICLE_MODEL_MAX = 80;

/** US model years are typically 4 digits; strip anything that is not 0–9. */
export function sanitizeVehicleYearInput(value) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 4);
}

/**
 * Length-cap make/model. Digits are allowed (Ram 2500, F-150, 911).
 *
 * @param {unknown} value
 * @param {number} maxLen
 */
export function sanitizeVehicleTextInput(value, maxLen) {
  return String(value ?? '').slice(0, maxLen);
}

/**
 * Normalize a vehicle for owner-booking payloads.
 *
 * @param {{ year?: unknown; make?: unknown; model?: unknown } | null | undefined} vehicle
 * @returns {{ year: string; make: string; model: string }}
 */
export function normalizeBookingVehicle(vehicle) {
  return {
    year: sanitizeVehicleYearInput(vehicle?.year),
    make: sanitizeVehicleTextInput(vehicle?.make, BOOKING_VEHICLE_MAKE_MAX).trim(),
    model: sanitizeVehicleTextInput(vehicle?.model, BOOKING_VEHICLE_MODEL_MAX).trim(),
  };
}

/**
 * Vehicle details are optional, but become all-or-none once any field is entered.
 *
 * @param {{ year?: unknown; make?: unknown; model?: unknown } | null | undefined} vehicle
 * @param {Date} [now]
 */
export function isOptionalVehicleComplete(vehicle, now = new Date()) {
  const year = String(vehicle?.year ?? '').trim();
  const make = String(vehicle?.make ?? '').trim();
  const model = String(vehicle?.model ?? '').trim();

  if (!year && !make && !model) {
    return true;
  }
  if (!year || !make || !model || !/^\d{4}$/.test(year)) {
    return false;
  }

  const yearNumber = Number(year);
  return yearNumber >= 1900 && yearNumber <= now.getFullYear() + 1;
}

/**
 * Completeness for owner-booking payloads (create appointment `jobs[].vehicle`).
 *
 * @param {{ year?: unknown; make?: unknown; model?: unknown } | null | undefined} vehicle
 * @param {Date} [now]
 */
export function isOptionalBookingVehicleComplete(vehicle, now = new Date()) {
  return isOptionalVehicleComplete(normalizeBookingVehicle(vehicle), now);
}
