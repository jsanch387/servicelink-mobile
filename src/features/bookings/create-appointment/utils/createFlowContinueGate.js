import {
  isAddressStepComplete,
  isCustomerStepComplete,
  isReviewStepComplete,
  isReviewVisitFieldsComplete,
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
 * @param {'chooser' | 'catalog'} [p.servicePickPhase]
 * @param {boolean} [p.isCustomJob]
 * @param {boolean} [p.customJobComplete]
 * @param {boolean} [p.pricingSkipped] when true, pricing step is bypassed (treat as satisfied)
 * @param {boolean} [p.locationSkipped] when true, location step is bypassed
 * @param {boolean} [p.addressSkipped] when true, customer address is not required
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
 * @param {boolean} [p.catalogPriceComplete] catalog job price override is valid when required
 * @param {boolean} [p.hasCommittedJobs] when Review has frozen jobs and no active draft
 */
export function canContinueCreateAppointmentStep({
  appointmentConfirmed,
  step,
  selectedServiceId,
  selectedPricingId,
  servicePickPhase = 'catalog',
  isCustomJob = false,
  customJobComplete = false,
  pricingSkipped = false,
  locationSkipped = false,
  addressSkipped = false,
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
  catalogPriceComplete = true,
  hasCommittedJobs = false,
}) {
  if (appointmentConfirmed) return false;
  if (step === CREATE_APPOINTMENT_STEP.SERVICE) {
    return servicePickPhase === 'catalog' && Boolean(selectedServiceId) && !isCustomJob;
  }
  if (step === CREATE_APPOINTMENT_STEP.PRICING) {
    if (isCustomJob) return customJobComplete;
    if (pricingSkipped) return true;
    const tierOk = isCreateFlowPricingSelectionValid({
      selectedPricingId,
      pricingOptions,
      priceOptionsLoading,
      priceOptionsEnabled,
    });
    return tierOk && catalogPriceComplete;
  }
  if (step === CREATE_APPOINTMENT_STEP.ADDONS) return true;
  if (step === CREATE_APPOINTMENT_STEP.LOCATION) {
    if (locationSkipped) return true;
    if (!isLocationStepComplete(appointmentLocationType)) return false;
    if (shopAddressMissing) return false;
    return true;
  }
  if (step === CREATE_APPOINTMENT_STEP.ADDRESS) return isAddressStepComplete(address);
  if (step === CREATE_APPOINTMENT_STEP.VEHICLE) {
    if (!isVehicleStepComplete(vehicle)) return false;
    if (!isCustomJob && pricingSkipped && !catalogPriceComplete) return false;
    return true;
  }
  if (step === CREATE_APPOINTMENT_STEP.SCHEDULE) {
    if (!acceptBookings) return false;
    if (scheduleLoading) return false;
    return Boolean(selectedDateKey && selectedTime && timeSlots.includes(selectedTime));
  }
  if (step === CREATE_APPOINTMENT_STEP.CUSTOMER) {
    if (businessServiceLocationLoading) return false;
    return isCustomerStepComplete(customer);
  }
  if (step === CREATE_APPOINTMENT_STEP.REVIEW) {
    const visitReady = isReviewVisitFieldsComplete({
      selectedDateKey,
      selectedTime,
      customer,
      appointmentLocationType,
      locationSkipped,
      addressSkipped,
      address,
    });
    if (!visitReady) return false;

    const hasActiveJobDraft = Boolean(selectedServiceId) || isCustomJob;
    if (!hasActiveJobDraft) {
      // Draft was removed on Review — confirm from committed job snapshots only.
      return hasCommittedJobs;
    }

    if (isCustomJob && !customJobComplete) return false;
    if (!isCustomJob && !catalogPriceComplete) return false;
    return isReviewStepComplete({
      selectedServiceId,
      selectedPricingId: isCustomJob ? selectedServiceId : selectedPricingId,
      pricingOptions: isCustomJob ? [{ id: selectedServiceId }] : pricingOptions,
      priceOptionsLoading,
      priceOptionsEnabled,
      selectedDateKey,
      selectedTime,
      customer,
      appointmentLocationType,
      locationSkipped,
      addressSkipped,
      address,
      vehicle,
    });
  }
  return true;
}
