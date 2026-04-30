import {
  isAddressStepComplete,
  isCustomerStepComplete,
  isReviewStepComplete,
  isVehicleStepComplete,
} from './createAppointmentValidators';

/**
 * Whether the primary action (Continue / Confirm) is allowed for the current wizard step.
 *
 * @param {object} p
 * @param {boolean} p.appointmentConfirmed
 * @param {number} p.step 0-based index into {@link CREATE_APPOINTMENT_STEP_META}
 * @param {string | null} p.selectedServiceId
 * @param {string | null} p.selectedPricingId
 * @param {boolean} p.acceptBookings
 * @param {boolean} p.scheduleLoading
 * @param {string | null} p.selectedDateKey
 * @param {string | null} p.selectedTime
 * @param {string[]} p.timeSlots
 * @param {object} p.customer
 * @param {object} p.address
 * @param {object} p.vehicle
 */
export function canContinueCreateAppointmentStep({
  appointmentConfirmed,
  step,
  selectedServiceId,
  selectedPricingId,
  acceptBookings,
  scheduleLoading,
  selectedDateKey,
  selectedTime,
  timeSlots,
  customer,
  address,
  vehicle,
}) {
  if (appointmentConfirmed) return false;
  if (step === 0) return Boolean(selectedServiceId);
  if (step === 1) return Boolean(selectedPricingId);
  if (step === 2) return true;
  if (step === 3) {
    if (!acceptBookings) return false;
    if (scheduleLoading) return false;
    return Boolean(selectedDateKey && selectedTime && timeSlots.includes(selectedTime));
  }
  if (step === 4) return isCustomerStepComplete(customer);
  if (step === 5) return isAddressStepComplete(address);
  if (step === 6) return isVehicleStepComplete(vehicle);
  if (step === 7) {
    return isReviewStepComplete({
      selectedServiceId,
      selectedPricingId,
      selectedDateKey,
      selectedTime,
      customer,
      address,
      vehicle,
    });
  }
  return true;
}
