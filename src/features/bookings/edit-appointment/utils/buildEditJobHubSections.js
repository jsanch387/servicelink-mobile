import { CREATE_APPOINTMENT_STEP } from '../../create-appointment/constants';
import { truncateHubSummary } from './buildEditHubSections';

function addonsSummary(selectedAddonRows) {
  const rows = selectedAddonRows ?? [];
  if (!rows.length) return 'None selected';
  if (rows.length === 1) {
    return String(rows[0]?.name ?? 'Add-on').trim() || '1 add-on';
  }
  return `${rows.length} add-ons selected`;
}

function vehicleSummary(vehicle) {
  const parts = [
    String(vehicle?.year ?? '').trim(),
    String(vehicle?.make ?? '').trim(),
    String(vehicle?.model ?? '').trim(),
  ].filter(Boolean);
  return parts.join(' ').trim() || 'Not set';
}

/**
 * Mini-hub for editing one job inside a multi-job appointment.
 * Pricing is part of Service & pricing — when tiers exist and a service is already
 * selected, open Pricing so the owner can change the tier without re-picking service.
 *
 * @param {object} args
 * @param {string} [args.jobTitle]
 * @param {boolean} [args.isCustomJob]
 * @param {boolean} args.pricingSkipped
 * @param {boolean} args.addonsSkipped
 * @param {string | null} [args.selectedServiceId]
 * @param {unknown} args.selectedService
 * @param {unknown} args.selectedPricingOption
 * @param {unknown[]} args.selectedAddonRows
 * @param {object} args.vehicle
 */
export function buildEditJobHubSections({
  jobTitle,
  isCustomJob = false,
  pricingSkipped,
  addonsSkipped,
  selectedServiceId = null,
  selectedService,
  selectedPricingOption: _selectedPricingOption,
  selectedAddonRows,
  vehicle,
}) {
  const serviceName =
    String(selectedService?.name ?? '').trim() || String(jobTitle ?? '').trim() || 'Not selected';
  const serviceSummary = truncateHubSummary(serviceName);
  const hasCatalogService = Boolean(String(selectedServiceId ?? '').trim());

  /** @type {import('./buildEditHubSections').EditHubSection[]} */
  const sections = [];

  if (isCustomJob) {
    sections.push({
      id: 'job-service',
      title: 'Custom job',
      summary: serviceSummary,
      icon: 'briefcase-outline',
      step: CREATE_APPOINTMENT_STEP.PRICING,
      summaryMaxLines: 2,
    });
  } else {
    sections.push({
      id: 'job-service',
      title: pricingSkipped ? 'Service' : 'Service & pricing',
      summary: serviceSummary,
      icon: 'briefcase-outline',
      // Re-open pricing when tiers exist so owners can change option without re-picking service.
      step:
        !pricingSkipped && hasCatalogService
          ? CREATE_APPOINTMENT_STEP.PRICING
          : CREATE_APPOINTMENT_STEP.SERVICE,
      summaryMaxLines: 2,
    });
  }

  if (!isCustomJob && !addonsSkipped) {
    sections.push({
      id: 'job-addons',
      title: 'Add-ons',
      summary: addonsSummary(selectedAddonRows),
      icon: 'add-circle-outline',
      step: CREATE_APPOINTMENT_STEP.ADDONS,
    });
  }

  sections.push({
    id: 'job-vehicle',
    title: 'Vehicle',
    summary: truncateHubSummary(vehicleSummary(vehicle)),
    icon: 'car-sport-outline',
    step: CREATE_APPOINTMENT_STEP.VEHICLE,
    summaryMaxLines: 2,
  });

  return sections;
}
