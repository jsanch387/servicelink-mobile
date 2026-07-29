import { CREATE_APPOINTMENT_CUSTOM_JOB_ID } from '../../create-appointment/constants';
import { snapshotCommittedJob } from '../../create-appointment/utils/createAppointmentJobs';
import { createEmptyVehicleForm } from '../constants';

/**
 * @param {import('./mapBookingJobsForEdit').EditJobSnapshot | null | undefined} job
 */
export function isEditJobCustom(job) {
  return Boolean(job?.isCustomJob) || !String(job?.selectedServiceId ?? '').trim();
}

/**
 * Build a committed job snapshot from the live edit draft fields.
 *
 * @param {object} p
 * @param {string} [p.localId]
 * @param {boolean} p.isCustomJob
 * @param {string | null} p.selectedServiceId
 * @param {{ name?: string } | null} p.selectedService
 * @param {unknown} p.selectedPricingOption
 * @param {unknown[]} p.selectedAddonRows
 * @param {number} p.totalDurationMinutes
 * @param {object} p.vehicle
 * @param {string | null} [p.selectedPricingId]
 * @param {string[]} [p.selectedAddonIds]
 * @param {string} [p.catalogPriceUsdText]
 * @param {string} [p.customServiceName]
 * @param {string} [p.customPriceUsdText]
 * @param {string} [p.customDurationHhMm]
 */
export function flushEditDraftToJobSnapshot(p) {
  const isCustom = Boolean(p.isCustomJob);
  return snapshotCommittedJob({
    localId: p.localId,
    selectedServiceId: isCustom ? null : p.selectedServiceId,
    isCustomJob: isCustom,
    selectedService: isCustom
      ? { name: String(p.customServiceName ?? p.selectedService?.name ?? '').trim() || 'Service' }
      : p.selectedService,
    selectedPricingOption: p.selectedPricingOption,
    selectedAddonRows: isCustom ? [] : p.selectedAddonRows,
    totalDurationMinutes: p.totalDurationMinutes,
    vehicle: p.vehicle ?? createEmptyVehicleForm(),
    selectedPricingId: isCustom ? null : (p.selectedPricingId ?? null),
    selectedAddonIds: isCustom ? [] : (p.selectedAddonIds ?? []),
    catalogPriceUsdText: p.catalogPriceUsdText ?? '',
    customServiceName: isCustom ? String(p.customServiceName ?? '').trim() : '',
    customPriceUsdText: isCustom ? String(p.customPriceUsdText ?? '').trim() : '',
    customDurationHhMm: p.customDurationHhMm ?? '01:00',
  });
}

/**
 * Values to apply when opening a job for editing.
 *
 * @param {import('./mapBookingJobsForEdit').EditJobSnapshot} job
 */
export function draftFieldsFromEditJob(job) {
  const custom = isEditJobCustom(job);
  return {
    selectedServiceId: custom
      ? CREATE_APPOINTMENT_CUSTOM_JOB_ID
      : job.selectedServiceId != null
        ? String(job.selectedServiceId)
        : null,
    selectedPricingId: job.selectedPricingId ?? null,
    selectedAddonIds: [...(job.selectedAddonIds ?? [])],
    vehicle: {
      year: String(job.vehicle?.year ?? ''),
      make: String(job.vehicle?.make ?? ''),
      model: String(job.vehicle?.model ?? ''),
    },
    catalogPriceUsdText: String(job.catalogPriceUsdText ?? ''),
    customServiceName: custom ? String(job.customServiceName || job.serviceName || '').trim() : '',
    customPriceUsdText: String(job.customPriceUsdText ?? ''),
    customDurationHhMm: String(job.customDurationHhMm ?? '01:00'),
    pricingOptionLabelHint: String(job.selectedPricingOption?.label ?? '').trim(),
  };
}

/**
 * Match a pricing option id from a stored tier label (edit hydrate).
 *
 * @param {Array<{ id: string; label?: string }>} options
 * @param {string | null | undefined} labelHint
 * @param {string | null | undefined} existingId
 */
export function resolvePricingIdFromLabelHint(options, labelHint, existingId = null) {
  const list = options ?? [];
  if (existingId && list.some((o) => o.id === existingId)) {
    return existingId;
  }
  const tip = String(labelHint ?? '')
    .trim()
    .toLowerCase();
  if (!tip || !list.length) {
    return existingId ?? list[0]?.id ?? null;
  }
  const exact = list.find(
    (o) =>
      String(o.label ?? '')
        .trim()
        .toLowerCase() === tip,
  );
  if (exact) return exact.id;
  if (tip === 'standard' || tip === 'base') {
    return list[0]?.id ?? null;
  }
  return existingId ?? list[0]?.id ?? null;
}

/**
 * @param {import('./mapBookingJobsForEdit').EditJobSnapshot[]} jobs
 * @param {number | null} activeJobIndex
 * @param {import('./mapBookingJobsForEdit').EditJobSnapshot | null} draftSnapshot
 */
export function mergeActiveJobIntoJobs(jobs, activeJobIndex, draftSnapshot) {
  const list = Array.isArray(jobs) ? [...jobs] : [];
  if (
    draftSnapshot &&
    activeJobIndex != null &&
    activeJobIndex >= 0 &&
    activeJobIndex < list.length
  ) {
    list[activeJobIndex] = draftSnapshot;
  }
  return list;
}
