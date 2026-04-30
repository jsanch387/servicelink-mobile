import { AddonsStep } from '../steps/AddonsStep';
import { AddressStep } from '../steps/AddressStep';
import { AppointmentConfirmedStep } from '../steps/AppointmentConfirmedStep';
import { CustomerStep } from '../steps/CustomerStep';
import { PricingStep } from '../steps/PricingStep';
import { ReviewStep } from '../steps/ReviewStep';
import { ScheduleStep } from '../steps/ScheduleStep';
import { ServiceStep } from '../steps/ServiceStep';
import { VehicleStep } from '../steps/VehicleStep';

/**
 * Renders the active wizard step (or confirmation). Keeps {@link CreateAppointmentFlow} declarative.
 *
 * @param {object} p
 */
export function CreateAppointmentStepContent(p) {
  const {
    step,
    appointmentConfirmed,
    catalogError,
    catalogIsLoading,
    enabledServices,
    selectedServiceId,
    onSelectServiceId,
    pricingOptions,
    selectedPricingId,
    selectedService,
    onSelectPricingId,
    selectedAddonIds,
    selectedPricingOption,
    addonsForSelectedService,
    onToggleAddon,
    acceptBookings,
    isDateUnavailable,
    scheduleError,
    scheduleLoading,
    selectedDateKey,
    selectedTime,
    timeSlots,
    onSelectDateKey,
    onSelectTime,
    customer,
    onChangeCustomer,
    address,
    onChangeAddress,
    vehicle,
    notes,
    onChangeVehicle,
    onChangeNotes,
  } = p;

  if (appointmentConfirmed) {
    return <AppointmentConfirmedStep />;
  }

  switch (step) {
    case 0:
      return (
        <ServiceStep
          catalogError={catalogError}
          isLoading={catalogIsLoading}
          selectedServiceId={selectedServiceId}
          services={enabledServices}
          onSelectServiceId={onSelectServiceId}
        />
      );
    case 1:
      return (
        <PricingStep
          pricingOptions={pricingOptions}
          selectedPricingId={selectedPricingId}
          service={selectedService}
          onSelectPricingId={onSelectPricingId}
        />
      );
    case 2:
      return (
        <AddonsStep
          selectedAddonIds={selectedAddonIds}
          selectedPricingOption={selectedPricingOption}
          service={selectedService}
          serviceAddons={addonsForSelectedService}
          onToggleAddon={onToggleAddon}
        />
      );
    case 3:
      return (
        <ScheduleStep
          acceptBookings={acceptBookings}
          isDateUnavailable={isDateUnavailable}
          scheduleError={scheduleError}
          scheduleLoading={scheduleLoading}
          selectedDateKey={selectedDateKey}
          selectedTime={selectedTime}
          timeSlots={timeSlots}
          onSelectDateKey={onSelectDateKey}
          onSelectTime={onSelectTime}
        />
      );
    case 4:
      return <CustomerStep customer={customer} onChangeCustomer={onChangeCustomer} />;
    case 5:
      return <AddressStep address={address} onChangeAddress={onChangeAddress} />;
    case 6:
      return (
        <VehicleStep
          notes={notes}
          vehicle={vehicle}
          onChangeNotes={onChangeNotes}
          onChangeVehicle={onChangeVehicle}
        />
      );
    case 7:
      return (
        <ReviewStep
          address={address}
          customer={customer}
          notes={notes}
          selectedAddonIds={selectedAddonIds}
          selectedDateKey={selectedDateKey}
          selectedPricingOption={selectedPricingOption}
          selectedService={selectedService}
          selectedTime={selectedTime}
          serviceAddons={addonsForSelectedService}
          vehicle={vehicle}
        />
      );
    default:
      return null;
  }
}
