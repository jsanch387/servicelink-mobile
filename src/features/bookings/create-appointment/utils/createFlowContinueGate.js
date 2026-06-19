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
 * @param {object | null} [p.selectedPricingOption] resolved tier from current options list
 * @param {boolean} [p.pricingSkipped] when true, pricing step is bypassed (treat as satisfied)
 * @param {boolean} [p.priceOptionsLoading] while Pro tiers load, block Continue on pricing step
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
  selectedPricingOption = null,
  pricingSkipped = false,
  priceOptionsLoading = false,
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
  if (step === 1) {
    if (pricingSkipped) return true;
    if (priceOptionsLoading) return false;
    return Boolean(selectedPricingOption);
  }
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
