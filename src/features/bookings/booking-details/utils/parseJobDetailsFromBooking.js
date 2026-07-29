function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function numberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function cleanStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * @param {unknown} vehicle
 * @returns {string}
 */
export function formatJobVehicleLine(vehicle) {
  if (!vehicle || typeof vehicle !== 'object') return '';
  const v = /** @type {Record<string, unknown>} */ (vehicle);
  const parts = [v.year, v.make, v.model]
    .map((p) => (p == null ? '' : String(p).trim()))
    .filter(Boolean);
  return parts.join(' ');
}

/**
 * @param {unknown} addOnsRaw
 * @returns {Array<{ id: string; name: string; price: number }>}
 */
function normalizeJobAddOns(addOnsRaw) {
  if (!addOnsRaw) return [];
  const source = Array.isArray(addOnsRaw)
    ? addOnsRaw
    : Array.isArray(addOnsRaw?.addons)
      ? addOnsRaw.addons
      : Array.isArray(addOnsRaw?.items)
        ? addOnsRaw.items
        : [];
  return source
    .map((item, idx) => {
      const cents = numberOrZero(item?.priceCents ?? item?.price_cents);
      const name =
        cleanStr(item?.name) ||
        cleanStr(item?.label) ||
        cleanStr(item?.title) ||
        `Add-on ${idx + 1}`;
      return {
        id: String(item?.id ?? item?.addon_id ?? `addon-${idx + 1}`),
        name,
        price: cents / 100,
      };
    })
    .filter((item) => item.price >= 0);
}

/**
 * Parses `bookings.job_details` (appointment-centric multi-job JSON) into display jobs.
 * Supports a raw array or `{ jobs: [...] }` / `{ items: [...] }`.
 * Returns [] when missing so callers can fall back to top-level service columns.
 *
 * @param {unknown} jobDetails
 * @returns {Array<{
 *   id: string;
 *   serviceName: string;
 *   pricingOption: string | null;
 *   servicePrice: number;
 *   addOns: Array<{ id: string; name: string; price: number }>;
 *   durationMinutes: number | null;
 *   vehicleLine: string;
 * }>}
 */
export function parseJobDetailsFromBooking(jobDetails) {
  if (jobDetails == null || jobDetails === '') return [];

  const parsed = typeof jobDetails === 'string' ? safeJsonParse(jobDetails) : jobDetails;
  if (!parsed) return [];

  const sourceItems = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.jobs)
      ? parsed.jobs
      : Array.isArray(parsed.items)
        ? parsed.items
        : [];

  return sourceItems
    .map((raw, idx) => {
      if (!raw || typeof raw !== 'object') return null;
      const item = /** @type {Record<string, unknown>} */ (raw);
      const serviceName =
        cleanStr(item.serviceName) ||
        cleanStr(item.service_name) ||
        cleanStr(item.name) ||
        `Job ${idx + 1}`;
      const optionRaw =
        cleanStr(item.servicePriceOptionLabel) ||
        cleanStr(item.service_price_option_label) ||
        cleanStr(item.pricingOption) ||
        cleanStr(item.optionLabel);
      const pricingOption = optionRaw && optionRaw !== 'Standard' ? optionRaw : null;
      const serviceCents = numberOrZero(item.servicePriceCents ?? item.service_price_cents);
      const durationRaw = item.durationMinutes ?? item.duration_minutes;
      const durationMinutes =
        durationRaw != null && Number.isFinite(Number(durationRaw))
          ? Math.max(0, Math.round(Number(durationRaw)))
          : null;
      const addOns = normalizeJobAddOns(
        item.selectedAddOns ?? item.selected_add_ons ?? item.addon_details ?? item.addons,
      );
      const vehicleLine = formatJobVehicleLine(item.vehicle);

      return {
        id: String(item.clientJobId ?? item.id ?? `job-${idx + 1}`),
        serviceName,
        pricingOption,
        servicePrice: serviceCents / 100,
        addOns,
        durationMinutes,
        vehicleLine,
      };
    })
    .filter(Boolean);
}
