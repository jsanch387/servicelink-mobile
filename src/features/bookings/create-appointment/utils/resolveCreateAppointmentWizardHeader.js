import { CREATE_APPOINTMENT_STEP } from '../constants';

/**
 * Step-specific wizard header copy (pricing / add-ons use the service name as the title).
 *
 * @param {number} step
 * @param {{ title?: string; subtitle?: string } | undefined} meta
 * @param {{ name?: string } | null | undefined} selectedService
 * @param {{ label?: string } | null | undefined} selectedPricingOption
 * @param {{ title?: string; subtitle?: string } | null | undefined} [addressStepCopy]
 */
export function resolveCreateAppointmentWizardHeader(
  step,
  meta,
  selectedService,
  selectedPricingOption,
  addressStepCopy = null,
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

  if (step === CREATE_APPOINTMENT_STEP.ADDRESS && addressStepCopy) {
    return {
      title: addressStepCopy.title ?? meta?.title ?? '',
      subtitle: addressStepCopy.subtitle ?? meta?.subtitle ?? '',
    };
  }

  return {
    title: meta?.title ?? '',
    subtitle: meta?.subtitle ?? '',
  };
}
