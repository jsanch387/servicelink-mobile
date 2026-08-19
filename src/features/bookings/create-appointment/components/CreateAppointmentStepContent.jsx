import { AddonsStep } from '../steps/AddonsStep';
import { AddressStep, LocationStep } from '../steps/AddressStep';
import { AppointmentConfirmedStep } from '../steps/AppointmentConfirmedStep';
import { CustomerStep } from '../steps/CustomerStep';
import { CustomJobStep } from '../steps/CustomJobStep';
import { PricingStep } from '../steps/PricingStep';
import { ReviewStep } from '../steps/ReviewStep';
import { ScheduleStep } from '../steps/ScheduleStep';
import { ServiceStep } from '../steps/ServiceStep';
import { VehicleStep } from '../steps/VehicleStep';
import { CREATE_APPOINTMENT_STEP } from '../constants';

/**
 * Renders the active wizard step (or confirmation). Keeps {@link CreateAppointmentFlow} declarative.
 *
 * @param {object} p
 */
export function CreateAppointmentStepContent(p) {
  const {
    step,
    appointmentConfirmed,
    confirmationReplayKey,
    catalogError,
    catalogIsLoading,
    categories = [],
    enabledServices,
    servicePickPhase,
    isCustomJob,
    selectedServiceId,
    onChooseServices,
    onChooseCustomJob,
    onSelectServiceId,
    customServiceName,
    customPriceUsdText,
    customPriceError,
    customDurationHhMm,
    onCustomServiceNameChange,
    onCustomPriceUsdTextChange,
    onCustomDurationHhMmChange,
    pricingOptions,
    priceOptionsLoading,
    selectedPricingId,
    selectedService,
    onSelectPricingId,
    catalogPriceUsdText,
    catalogPriceError,
    onCatalogPriceUsdTextChange,
    selectedAddonIds,
    selectedPricingOption,
    addonsForSelectedService,
    onToggleAddon,
    acceptBookings,
    isDateUnavailable,
    maxDate,
    minDate,
    scheduleError,
    scheduleLoading,
    selectedDateKey,
    selectedTime,
    timeSlots,
    onSelectDateKey,
    onSelectTime,
    customer,
    onChangeCustomer,
    appointmentLocationType,
    onSelectLocationType,
    address,
    onChangeAddress,
    shopAddressMissing,
    vehicle,
    notes,
    onChangeVehicle,
    onChangeNotes,
    totalDurationMinutes,
    showSubmitPanel,
    availableSaleDiscount = null,
    applySaleDiscount = false,
    onToggleApplySaleDiscount,
    appliedSaleDiscount = null,
    reviewJobs = null,
    jobNumber = 1,
    showVisitNotes: showVisitNotesProp,
    canAddAnotherJob = false,
    addAnotherJobDisabled = false,
    onAddAnotherJob,
    onRemoveJob,
    isMembershipVisit = false,
  } = p;

  if (appointmentConfirmed) {
    return <AppointmentConfirmedStep replayKey={confirmationReplayKey} />;
  }

  /** Notes are visit-level — only collect on the first vehicle pass (or custom job). */
  const showVisitNotes =
    typeof showVisitNotesProp === 'boolean' ? showVisitNotesProp : jobNumber <= 1;

  switch (step) {
    case CREATE_APPOINTMENT_STEP.SERVICE:
      return (
        <ServiceStep
          catalogError={catalogError}
          categories={categories}
          isLoading={catalogIsLoading}
          phase={servicePickPhase}
          selectedServiceId={selectedServiceId}
          services={enabledServices}
          onChooseCustomJob={onChooseCustomJob}
          onChooseServices={onChooseServices}
          onSelectServiceId={onSelectServiceId}
        />
      );
    case CREATE_APPOINTMENT_STEP.PRICING:
      if (isCustomJob) {
        return (
          <CustomJobStep
            durationHhMm={customDurationHhMm}
            membershipVisit={isMembershipVisit}
            notes={showVisitNotes ? notes : undefined}
            priceErrorText={customPriceError}
            priceUsdText={customPriceUsdText}
            serviceName={customServiceName}
            showNotes={showVisitNotes}
            onDurationHhMmChange={onCustomDurationHhMmChange}
            onPriceUsdTextChange={onCustomPriceUsdTextChange}
            onServiceNameChange={onCustomServiceNameChange}
            onNotesChange={onChangeNotes}
          />
        );
      }
      return (
        <PricingStep
          catalogPriceError={catalogPriceError}
          catalogPriceUsdText={catalogPriceUsdText}
          priceOptionsLoading={priceOptionsLoading}
          pricingOptions={pricingOptions}
          selectedPricingId={selectedPricingId}
          service={selectedService}
          onCatalogPriceUsdTextChange={onCatalogPriceUsdTextChange}
          onSelectPricingId={onSelectPricingId}
        />
      );
    case CREATE_APPOINTMENT_STEP.ADDONS:
      return (
        <AddonsStep
          catalogPriceUsdText={catalogPriceUsdText}
          selectedAddonIds={selectedAddonIds}
          selectedPricingOption={selectedPricingOption}
          service={selectedService}
          serviceAddons={addonsForSelectedService}
          onCatalogPriceUsdTextChange={isCustomJob ? undefined : onCatalogPriceUsdTextChange}
          onToggleAddon={onToggleAddon}
        />
      );
    case CREATE_APPOINTMENT_STEP.LOCATION:
      return (
        <LocationStep
          appointmentLocationType={appointmentLocationType}
          shopAddressMissing={shopAddressMissing}
          onSelectLocationType={onSelectLocationType}
        />
      );
    case CREATE_APPOINTMENT_STEP.ADDRESS:
      return <AddressStep address={address} onChangeAddress={onChangeAddress} />;
    case CREATE_APPOINTMENT_STEP.VEHICLE:
      return (
        <VehicleStep
          addAnotherJobDisabled={addAnotherJobDisabled}
          canAddAnotherJob={canAddAnotherJob}
          notes={notes}
          showNotes={showVisitNotes && !isCustomJob}
          vehicle={vehicle}
          onAddAnotherJob={onAddAnotherJob}
          onChangeNotes={onChangeNotes}
          onChangeVehicle={onChangeVehicle}
        />
      );
    case CREATE_APPOINTMENT_STEP.SCHEDULE:
      return (
        <ScheduleStep
          acceptBookings={acceptBookings}
          isDateUnavailable={isDateUnavailable}
          maxDate={maxDate}
          minDate={minDate}
          scheduleError={scheduleError}
          scheduleLoading={scheduleLoading}
          selectedDateKey={selectedDateKey}
          selectedTime={selectedTime}
          timeSlots={timeSlots}
          onSelectDateKey={onSelectDateKey}
          onSelectTime={onSelectTime}
        />
      );
    case CREATE_APPOINTMENT_STEP.CUSTOMER:
      return <CustomerStep customer={customer} onChangeCustomer={onChangeCustomer} />;
    case CREATE_APPOINTMENT_STEP.REVIEW:
      if (showSubmitPanel) {
        return null;
      }
      return (
        <ReviewStep
          address={address}
          appointmentLocationType={appointmentLocationType}
          appliedSaleDiscount={appliedSaleDiscount}
          applySaleDiscount={applySaleDiscount}
          availableSaleDiscount={availableSaleDiscount}
          canAddAnotherJob={canAddAnotherJob}
          customer={customer}
          isMembershipVisit={isMembershipVisit}
          jobs={reviewJobs}
          notes={notes}
          selectedAddonIds={selectedAddonIds}
          selectedDateKey={selectedDateKey}
          selectedPricingOption={selectedPricingOption}
          selectedService={selectedService}
          selectedTime={selectedTime}
          serviceAddons={addonsForSelectedService}
          totalDurationMinutes={totalDurationMinutes}
          vehicle={vehicle}
          onAddAnotherJob={onAddAnotherJob}
          addAnotherJobDisabled={addAnotherJobDisabled}
          onRemoveJob={onRemoveJob}
          onToggleApplySaleDiscount={onToggleApplySaleDiscount}
        />
      );
    default:
      return null;
  }
}
