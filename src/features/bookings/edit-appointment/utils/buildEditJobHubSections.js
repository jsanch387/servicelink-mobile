import { CREATE_APPOINTMENT_STEP } from '../../create-appointment/constants';
import { truncateHubSummary } from './buildEditHubSections';

function vehicleSummary(vehicle) {
  const parts = [
    String(vehicle?.year ?? '').trim(),
    String(vehicle?.make ?? '').trim(),
    String(vehicle?.model ?? '').trim(),
  ].filter(Boolean);
  return parts.join(' ').trim() || 'Not set';
}

/**
 * Mini-hub for editing one job. Pricing stays with Service; Add-ons live on the
 * visit hub for quicker access.
 *
 * @param {object} args
 * @param {string} [args.jobTitle]
 * @param {boolean} [args.isCustomJob]
 * @param {boolean} args.pricingSkipped
 * @param {string | null} [args.selectedServiceId]
 * @param {unknown} args.selectedService
 * @param {object} args.vehicle
 */
export function buildEditJobHubSections({
  jobTitle,
  isCustomJob = false,
  pricingSkipped,
  selectedServiceId = null,
  selectedService,
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
