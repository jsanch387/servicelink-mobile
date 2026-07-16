import { CREATE_APPOINTMENT_STEP } from '../constants';

/**
 * Step-specific wizard header copy.
 *
 * @param {number} step
 * @param {{ title?: string; subtitle?: string } | undefined} meta
 * @param {{ title?: string; subtitle?: string } | null | undefined} [addressStepCopy]
 * @param {{ servicePickPhase?: 'chooser' | 'catalog'; isCustomJob?: boolean }} [context]
 */
export function resolveCreateAppointmentWizardHeader(
  step,
  meta,
  addressStepCopy = null,
  context = {},
) {
  if (step === CREATE_APPOINTMENT_STEP.SERVICE && context.servicePickPhase === 'catalog') {
    return {
      title: 'Choose a service',
      subtitle: 'Pick one of your services for this appointment.',
    };
  }

  if (step === CREATE_APPOINTMENT_STEP.PRICING && context.isCustomJob) {
    return {
      title: 'Custom job',
      subtitle: 'Name it, set a price, and estimate duration.',
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
