import { CREATE_APPOINTMENT_STEP } from '../constants';

/**
 * Step-specific wizard header copy (pricing / add-ons use the service name as the title).
 *
 * @param {number} step
 * @param {{ title?: string; subtitle?: string } | undefined} meta
 * @param {{ name?: string } | null | undefined} selectedService
 * @param {{ label?: string } | null | undefined} selectedPricingOption
 */
export function resolveCreateAppointmentWizardHeader(
  step,
  meta,
  selectedService,
  selectedPricingOption,
) {
  if (step === CREATE_APPOINTMENT_STEP.PRICING && selectedService?.name) {
    return {
      title: selectedService.name,
      subtitle: 'Choose a price tier',
    };
  }

  if (step === CREATE_APPOINTMENT_STEP.ADDONS && selectedService?.name) {
    const tierLabel = String(selectedPricingOption?.label ?? '').trim();
    return {
      title: selectedService.name,
      subtitle: tierLabel
        ? `${tierLabel} · Optional add-ons`
        : 'Optional add-ons — skip if none needed',
    };
  }

  return {
    title: meta?.title ?? '',
    subtitle: meta?.subtitle ?? '',
  };
}
