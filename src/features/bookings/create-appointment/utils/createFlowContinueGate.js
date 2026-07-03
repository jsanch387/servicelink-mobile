import {
  isAddressStepComplete,
  isCustomerStepComplete,
  isReviewStepComplete,
  isVehicleStepComplete,
} from './createAppointmentValidators';
import { isCreateFlowPricingSelectionValid } from './createFlowPricing';
import { isLocationStepComplete } from './createAppointmentServiceLocation';
import { CREATE_APPOINTMENT_STEP } from '../constants';

/**
 * Whether the primary action (Continue / Confirm) is allowed for the current wizard step.
 *
 * @param {object} p
 * @param {boolean} p.appointmentConfirmed
 * @param {number} p.step 0-based index into {@link CREATE_APPOINTMENT_STEP_META}
 * @param {string | null} p.selectedServiceId
 * @param {string | null} p.selectedPricingId
 * @param {boolean} [p.pricingSkipped] when true, pricing step is bypassed (treat as satisfied)
 * @param {boolean} [p.locationSkipped] when true, location step is bypassed
 * @param {boolean} [p.businessServiceLocationLoading]
 * @param {Array<{ id: string }>} [p.pricingOptions]
 * @param {boolean} [p.priceOptionsLoading]
 * @param {boolean} [p.priceOptionsEnabled]
 * @param {boolean} p.acceptBookings
 * @param {boolean} p.scheduleLoading
 * @param {string | null} p.selectedDateKey
 * @param {string | null} p.selectedTime
 * @param {string[]} p.timeSlots
 * @param {object} p.customer
 * @param {'mobile' | 'shop' | null} [p.appointmentLocationType]
 * @param {boolean} [p.shopAddressMissing]
 * @param {object} p.address
 * @param {object} p.vehicle
 */
export function canContinueCreateAppointmentStep({
  appointmentConfirmed,
  step,
  selectedServiceId,
  selectedPricingId,
  pricingSkipped = false,
  locationSkipped = false,
  businessServiceLocationLoading = false,
  pricingOptions = [],
  priceOptionsLoading = false,
  priceOptionsEnabled = false,
  acceptBookings,
  scheduleLoading,
  selectedDateKey,
  selectedTime,
  timeSlots,
  customer,
  appointmentLocationType = null,
  shopAddressMissing = false,
  address,
  vehicle,
}) {
  if (appointmentConfirmed) return false;
  if (step === CREATE_APPOINTMENT_STEP.SERVICE) return Boolean(selectedServiceId);
  if (step === CREATE_APPOINTMENT_STEP.PRICING) {
    if (pricingSkipped) return true;
    return isCreateFlowPricingSelectionValid({
      selectedPricingId,
      pricingOptions,
      priceOptionsLoading,
      priceOptionsEnabled,
    });
  }
  if (step === CREATE_APPOINTMENT_STEP.ADDONS) return true;
  if (step === CREATE_APPOINTMENT_STEP.SCHEDULE) {
    if (!acceptBookings) return false;
    if (scheduleLoading) return false;
    return Boolean(selectedDateKey && selectedTime && timeSlots.includes(selectedTime));
  }
  if (step === CREATE_APPOINTMENT_STEP.CUSTOMER) {
    if (businessServiceLocationLoading) return false;
    return isCustomerStepComplete(customer);
  }
  if (step === CREATE_APPOINTMENT_STEP.LOCATION) {
    if (locationSkipped) return true;
    if (!isLocationStepComplete(appointmentLocationType)) return false;
    if (shopAddressMissing) return false;
    return true;
  }
  if (step === CREATE_APPOINTMENT_STEP.ADDRESS) return isAddressStepComplete(address);
  if (step === CREATE_APPOINTMENT_STEP.VEHICLE) return isVehicleStepComplete(vehicle);
  if (step === CREATE_APPOINTMENT_STEP.REVIEW) {
    return isReviewStepComplete({
      selectedServiceId,
      selectedPricingId,
      pricingOptions,
      priceOptionsLoading,
      priceOptionsEnabled,
      selectedDateKey,
      selectedTime,
      customer,
      appointmentLocationType,
      locationSkipped,
      address,
      vehicle,
    });
  }
  return true;
}
