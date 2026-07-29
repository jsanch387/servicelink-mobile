import { parseJobDetailsFromBooking } from '../../booking-details/utils/parseJobDetailsFromBooking';
import { formatUsdFromNumber } from '../../create-appointment/utils/priceLabelMath';
import { createEmptyVehicleForm } from '../constants';

/**
 * @typedef {{
 *   localId: string;
 *   selectedServiceId: string | null;
 *   isCustomJob: boolean;
 *   serviceName: string;
 *   selectedPricingOption: {
 *     id?: string;
 *     label?: string;
 *     priceCents?: number;
 *     priceLabel?: string;
 *     durationMinutes?: number;
 *   } | null;
 *   selectedAddonRows: Array<{
 *     id: unknown;
 *     name?: string;
 *     priceCents?: number;
 *     priceLabel?: string;
 *     durationMinutes?: number | null;
 *   }>;
 *   totalDurationMinutes: number;
 *   vehicle: { year: string; make: string; model: string };
 *   selectedPricingId: string | null;
 *   selectedAddonIds: string[];
 *   catalogPriceUsdText: string;
 *   customServiceName: string;
 *   customPriceUsdText: string;
 *   customDurationHhMm: string;
 * }} EditJobSnapshot
 */

/**
 * @param {number} cents
 */
function centsToUsdText(cents) {
  const n = Math.max(0, Math.round(Number(cents) || 0)) / 100;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/**
 * @param {unknown} jobDetails
 * @returns {unknown[]}
 */
function rawJobDetailsArray(jobDetails) {
  if (Array.isArray(jobDetails)) return jobDetails;
  if (jobDetails && typeof jobDetails === 'object') {
    const obj = /** @type {Record<string, unknown>} */ (jobDetails);
    if (Array.isArray(obj.jobs)) return obj.jobs;
    if (Array.isArray(obj.items)) return obj.items;
  }
  if (typeof jobDetails === 'string') {
    try {
      return rawJobDetailsArray(JSON.parse(jobDetails));
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * @param {unknown} vehicle
 * @param {string} vehicleLine
 */
function resolveVehicle(vehicle, vehicleLine) {
  if (vehicle && typeof vehicle === 'object') {
    const v = /** @type {Record<string, unknown>} */ (vehicle);
    return {
      year: String(v.year ?? '').trim(),
      make: String(v.make ?? '').trim(),
      model: String(v.model ?? '').trim(),
    };
  }
  const parts = String(vehicleLine ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 3) {
    return {
      year: parts[0],
      make: parts.slice(1, -1).join(' '),
      model: parts[parts.length - 1],
    };
  }
  return createEmptyVehicleForm();
}

/**
 * @param {unknown} addonDetails
 * @returns {Array<{
 *   id: unknown;
 *   name?: string;
 *   priceCents?: number;
 *   priceLabel?: string;
 *   durationMinutes?: number | null;
 * }>}
 */
function legacyAddonRowsFromBooking(addonDetails) {
  if (!addonDetails) return [];
  let parsed = addonDetails;
  if (typeof addonDetails === 'string') {
    try {
      parsed = JSON.parse(addonDetails);
    } catch {
      return [];
    }
  }
  const sourceItems = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.items)
      ? parsed.items
      : Array.isArray(parsed?.addons)
        ? parsed.addons
        : [];

  return sourceItems
    .map((item, idx) => {
      const id = item?.id ?? item?.addon_id ?? `legacy-addon-${idx}`;
      const name =
        String(item?.name ?? item?.label ?? item?.title ?? '').trim() || `Add-on ${idx + 1}`;
      const priceCentsRaw = item?.priceCents ?? item?.price_cents;
      const priceCents = Math.max(0, Math.round(Number(priceCentsRaw) || 0));
      return {
        id,
        name,
        priceCents,
        priceLabel: formatUsdFromNumber(priceCents / 100),
        durationMinutes: 0,
      };
    })
    .filter((row) => row.id != null && String(row.id).trim());
}

/**
 * Build editable job snapshots from `job_details`, or one synthetic job from flat columns.
 *
 * @param {Record<string, unknown> | null | undefined} booking
 * @returns {EditJobSnapshot[]}
 */
export function mapBookingJobsForEdit(booking) {
  if (!booking) return [];

  const jobDetails = booking.job_details ?? booking.jobDetails;
  const parsed = parseJobDetailsFromBooking(jobDetails);
  const rawList = rawJobDetailsArray(jobDetails);

  if (parsed.length > 0) {
    const legacyFallbackAddons =
      parsed.length === 1 ? legacyAddonRowsFromBooking(booking.addon_details) : [];

    return parsed.map((job, index) => {
      const raw =
        rawList[index] && typeof rawList[index] === 'object'
          ? /** @type {Record<string, unknown>} */ (rawList[index])
          : {};
      const serviceIdRaw = raw.serviceId ?? raw.service_id;
      const serviceId =
        serviceIdRaw != null && String(serviceIdRaw).trim() ? String(serviceIdRaw).trim() : null;
      const custom = !serviceId;
      const priceCents = Math.max(0, Math.round(Number(job.servicePrice) * 100) || 0);
      const durationMinutes = Math.max(
        1,
        Math.round(
          Number(job.durationMinutes) || Number(raw.durationMinutes ?? raw.duration_minutes) || 60,
        ),
      );
      let addonRows = (job.addOns ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        priceCents: Math.round(Number(a.price) * 100),
        priceLabel: formatUsdFromNumber(a.price),
        durationMinutes: 0,
      }));
      // Heal single-job rows that only had add-ons mirrored on legacy addon_details.
      if (addonRows.length === 0 && index === 0 && legacyFallbackAddons.length > 0) {
        addonRows = legacyFallbackAddons;
      }

      return {
        localId: String(job.id || `edit-job-${index}`),
        selectedServiceId: serviceId,
        isCustomJob: custom,
        serviceName: job.serviceName || 'Service',
        selectedPricingOption: {
          id: job.pricingOption ? `label:${job.pricingOption}` : undefined,
          label: job.pricingOption || 'Standard',
          priceCents,
          priceLabel: formatUsdFromNumber(job.servicePrice),
          durationMinutes,
        },
        selectedAddonRows: addonRows,
        totalDurationMinutes: durationMinutes,
        vehicle: resolveVehicle(raw.vehicle, job.vehicleLine),
        selectedPricingId: null,
        selectedAddonIds: addonRows.map((a) => String(a.id)),
        catalogPriceUsdText: custom ? '' : centsToUsdText(priceCents),
        customServiceName: custom ? job.serviceName : '',
        customPriceUsdText: custom ? centsToUsdText(priceCents) : '',
        customDurationHhMm: '01:00',
      };
    });
  }

  const priceCents = Math.max(0, Math.round(Number(booking.service_price_cents) || 0));
  const serviceId =
    booking.service_id != null && String(booking.service_id).trim()
      ? String(booking.service_id).trim()
      : null;
  const durationMinutes = Math.max(1, Math.round(Number(booking.duration_minutes) || 60));
  const addonRows = legacyAddonRowsFromBooking(booking.addon_details);

  return [
    {
      localId: 'legacy-job-0',
      selectedServiceId: serviceId,
      isCustomJob: !serviceId,
      serviceName: String(booking.service_name ?? '').trim() || 'Service',
      selectedPricingOption: {
        label: 'Standard',
        priceCents,
        priceLabel: formatUsdFromNumber(priceCents / 100),
        durationMinutes,
      },
      selectedAddonRows: addonRows,
      totalDurationMinutes: durationMinutes,
      vehicle: {
        year:
          booking.customer_vehicle_year != null && String(booking.customer_vehicle_year).trim()
            ? String(booking.customer_vehicle_year).trim()
            : '',
        make: String(booking.customer_vehicle_make ?? '').trim(),
        model: String(booking.customer_vehicle_model ?? '').trim(),
      },
      selectedPricingId: null,
      selectedAddonIds: addonRows.map((a) => String(a.id)),
      catalogPriceUsdText: serviceId ? centsToUsdText(priceCents) : '',
      customServiceName: !serviceId ? String(booking.service_name ?? '').trim() : '',
      customPriceUsdText: !serviceId ? centsToUsdText(priceCents) : '',
      customDurationHhMm: '01:00',
    },
  ];
}

/**
 * @param {EditJobSnapshot[] | null | undefined} jobs
 */
export function isMultiJobEdit(jobs) {
  return Array.isArray(jobs) && jobs.length > 1;
}

/**
 * @param {EditJobSnapshot[] | null | undefined} jobs
 */
export function formatEditJobsHubSummary(jobs) {
  const list = Array.isArray(jobs) ? jobs : [];
  if (list.length === 0) return 'No jobs';
  if (list.length === 1) {
    return String(list[0]?.serviceName ?? '').trim() || '1 job';
  }
  const first = String(list[0]?.serviceName ?? '').trim() || 'Job';
  return `${first} +${list.length - 1} more`;
}

/**
 * @param {EditJobSnapshot[] | null | undefined} jobs
 */
export function sumEditJobsDurationMinutes(jobs) {
  return (jobs ?? []).reduce(
    (sum, job) => sum + Math.max(0, Math.round(Number(job?.totalDurationMinutes) || 0)),
    0,
  );
}
