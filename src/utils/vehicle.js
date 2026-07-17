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
