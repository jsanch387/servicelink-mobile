import { createEmptyVehicleForm } from '../constants';
import { formatUsdFromNumber } from './priceLabelMath';

/**
 * @returns {{
 *   selectedServiceId: null;
 *   customServiceName: string;
 *   customPriceUsdText: string;
 *   customDurationHhMm: string;
 *   selectedPricingId: null;
 *   catalogPriceUsdText: string;
 *   selectedAddonIds: string[];
 *   vehicle: { year: string; make: string; model: string };
 * }}
 */
export function createEmptyJobDraft() {
  return {
    selectedServiceId: null,
    customServiceName: '',
    customPriceUsdText: '',
    customDurationHhMm: '01:00',
    selectedPricingId: null,
    catalogPriceUsdText: '',
    selectedAddonIds: [],
    vehicle: createEmptyVehicleForm(),
  };
}

/**
 * Snapshot of a finished job unit for review + multi-booking submit.
 *
 * @param {object} p
 * @param {string | null} p.selectedServiceId
 * @param {boolean} p.isCustomJob
 * @param {{ name?: string } | null} p.selectedService
 * @param {{
 *   id?: string;
 *   label?: string;
 *   priceCents?: number;
 *   priceLabel?: string;
 *   durationMinutes?: number;
 * } | null} p.selectedPricingOption
 * @param {Array<{ id: unknown; name?: string; priceCents?: number; priceLabel?: string; durationMinutes?: number | null }>} p.selectedAddonRows
 * @param {number} p.totalDurationMinutes
 * @param {{ year: string; make: string; model: string }} p.vehicle
 * @param {string} [p.localId] stable id when re-snapshotting the active draft
 * @param {string} [p.catalogPriceUsdText]
 * @param {string} [p.customServiceName]
 * @param {string} [p.customPriceUsdText]
 * @param {string} [p.customDurationHhMm]
 * @param {string | null} [p.selectedPricingId]
 * @param {string[]} [p.selectedAddonIds]
 */
export function snapshotCommittedJob(p) {
  const priceCents = Math.max(0, Math.round(Number(p.selectedPricingOption?.priceCents) || 0));
  const priceLabel =
    p.selectedPricingOption?.priceLabel?.trim() || formatUsdFromNumber(priceCents / 100) || '$0';

  return {
    localId: p.localId ?? `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    selectedServiceId: p.isCustomJob ? null : p.selectedServiceId,
    isCustomJob: Boolean(p.isCustomJob),
    serviceName: String(p.selectedService?.name ?? '').trim() || 'Service',
    selectedPricingOption: p.selectedPricingOption
      ? {
          id: p.selectedPricingOption.id,
          label: p.selectedPricingOption.label ?? '',
          priceCents,
          priceLabel,
          durationMinutes: p.selectedPricingOption.durationMinutes ?? 0,
        }
      : null,
    selectedAddonRows: (p.selectedAddonRows ?? []).map((a) => ({ ...a })),
    totalDurationMinutes: Math.max(1, Math.round(Number(p.totalDurationMinutes) || 0)),
    vehicle: {
      year: String(p.vehicle?.year ?? ''),
      make: String(p.vehicle?.make ?? ''),
      model: String(p.vehicle?.model ?? ''),
    },
    // Restore fields when backing out of a later job
    customServiceName: String(p.customServiceName ?? ''),
    customPriceUsdText: String(p.customPriceUsdText ?? ''),
    customDurationHhMm: String(p.customDurationHhMm ?? '01:00'),
    selectedPricingId: p.selectedPricingId ?? null,
    catalogPriceUsdText: String(p.catalogPriceUsdText ?? ''),
    selectedAddonIds: [...(p.selectedAddonIds ?? [])],
  };
}

/**
 * @param {Array<{ totalDurationMinutes?: number }>} jobs
 */
export function sumJobDurationsMinutes(jobs) {
  return (jobs ?? []).reduce(
    (sum, job) => sum + Math.max(0, Math.round(Number(job?.totalDurationMinutes) || 0)),
    0,
  );
}

/**
 * Visit-level note prefix so linked bookings stay recognizable.
 *
 * @param {string} notes
 * @param {number} jobIndex 0-based
 * @param {number} jobCount
 */
export function mergeVisitJobNotes(notes, jobIndex, jobCount) {
  const base = String(notes ?? '').trim();
  if (jobCount <= 1) return base.slice(0, 280);
  const prefix = `Visit job ${jobIndex + 1} of ${jobCount}`;
  if (!base) return prefix.slice(0, 280);
  return `${prefix}. ${base}`.slice(0, 280);
}
