import { StyleSheet, View } from 'react-native';
import { SurfaceCard } from '../../../../components/ui';
import {
  CREATE_QUOTE_STEP,
  CREATE_QUOTE_WRAP_INPUT_STEPS_IN_SURFACE_CARD,
} from '../../constants/createQuoteWizard';
import { CreateQuoteStepAddons } from './CreateQuoteStepAddons';
import { CreateQuoteStepCustomer } from './CreateQuoteStepCustomer';
import { CreateQuoteStepNote } from './CreateQuoteStepNote';
import { CreateQuoteStepPricing } from './CreateQuoteStepPricing';
import { CreateQuoteStepReview } from './CreateQuoteStepReview';
import { CreateQuoteStepSchedule } from './CreateQuoteStepSchedule';
import { CreateQuoteStepSchedulePick } from './CreateQuoteStepSchedulePick';
import { CreateQuoteStepService } from './CreateQuoteStepService';
import { CreateQuoteStepServicePick } from './CreateQuoteStepServicePick';
import { CreateQuoteStepVehicle } from './CreateQuoteStepVehicle';

const inputSurfacePad = StyleSheet.create({
  surface: {
    paddingBottom: 18,
    paddingHorizontal: 14,
    paddingTop: 18,
  },
  sections: {
    gap: 16,
  },
});

/**
 * @param {import('react').ReactNode} node
 */
function wrapInputStepSurface(node) {
  if (!CREATE_QUOTE_WRAP_INPUT_STEPS_IN_SURFACE_CARD) {
    return node;
  }
  return (
    <SurfaceCard outlined padding="none" style={inputSurfacePad.surface}>
      {node}
    </SurfaceCard>
  );
}

/**
 * @param {object} props
 * @param {number} props.stepIndex Logical step (`CREATE_QUOTE_STEP`).
 * @param {object} props.form
 */
export function CreateQuoteStepContent({ stepIndex, form }) {
  switch (stepIndex) {
    case CREATE_QUOTE_STEP.CUSTOMER:
      return wrapInputStepSurface(
        <CreateQuoteStepCustomer
          customerEmail={form.customerEmail}
          customerName={form.customerName}
          customerPhoneDisplay={form.customerPhoneDisplay}
          onCustomerEmailChange={form.setCustomerEmail}
          onCustomerNameChange={form.setCustomerName}
          onCustomerPhoneChange={form.setCustomerPhoneDisplay}
        />,
      );
    case CREATE_QUOTE_STEP.VEHICLE:
      return wrapInputStepSurface(
        <CreateQuoteStepVehicle
          vehicleMake={form.vehicleMake}
          vehicleModel={form.vehicleModel}
          vehicleYear={form.vehicleYear}
          onVehicleMakeChange={form.setVehicleMake}
          onVehicleModelChange={form.setVehicleModel}
          onVehicleYearChange={form.setVehicleYear}
        />,
      );
    case CREATE_QUOTE_STEP.SERVICE:
      return (
        <CreateQuoteStepServicePick
          catalogError={form.catalogError}
          categories={form.catalogCategories}
          isLoading={form.catalogLoading}
          phase={form.servicePickPhase}
          selectedServiceId={form.selectedServiceId}
          services={form.catalogServices}
          onChooseCustomJob={form.onChooseCustomJob}
          onChooseYourServices={form.onChooseYourServices}
          onSelectCatalogService={form.onSelectCatalogService}
        />
      );
    case CREATE_QUOTE_STEP.DETAILS:
      if (form.isCustomJob) {
        return (
          <View style={inputSurfacePad.sections}>
            {wrapInputStepSurface(
              <CreateQuoteStepService
                durationHhMm={form.durationHhMm}
                priceUsdText={form.priceUsdText}
                serviceName={form.serviceName}
                onDurationHhMmChange={form.setDurationHhMm}
                onPriceUsdTextChange={form.setPriceUsdText}
                onServiceNameChange={form.setServiceName}
              />,
            )}
            <CreateQuoteStepNote
              note={form.businessNote}
              onNoteChange={form.setBusinessNote}
              onFocus={form.onBusinessNoteFocus}
            />
          </View>
        );
      }
      return (
        <CreateQuoteStepPricing
          pricingOptions={form.pricingOptions}
          selectedPricingId={form.selectedPricingId}
          service={form.selectedCatalogService}
          onSelectPricingId={form.setSelectedPricingId}
        />
      );
    case CREATE_QUOTE_STEP.ADDONS:
      return (
        <CreateQuoteStepAddons
          selectedAddonIds={form.selectedAddonIds}
          selectedPricingOption={form.selectedPricingOption}
          service={form.selectedCatalogService}
          serviceAddons={form.addonsForSelectedService}
          onToggleAddon={form.onToggleAddon}
        />
      );
    case CREATE_QUOTE_STEP.SCHEDULE:
      return (
        <CreateQuoteStepSchedule
          onChooseDate={form.onChooseScheduleDate}
          onLetCustomerChoose={form.onLetCustomerChooseSchedule}
        />
      );
    case CREATE_QUOTE_STEP.SCHEDULE_PICK:
      return (
        <CreateQuoteStepSchedulePick
          scheduledDateYyyyMmDd={form.scheduledDateYyyyMmDd}
          scheduledStartTime12h={form.scheduledStartTime12h}
          onScheduledDateChange={form.setScheduledDateYyyyMmDd}
          onScheduledStartTimeChange={form.setScheduledStartTime12h}
        />
      );
    case CREATE_QUOTE_STEP.REVIEW:
      return (
        <CreateQuoteStepReview
          addonLines={form.addonLines}
          businessNote={form.businessNote}
          customerEmail={form.customerEmail}
          customerName={form.customerName}
          customerPhoneDisplay={form.customerPhoneDisplay}
          customerRequestNotes={form.customerRequestNotes}
          durationHhMm={form.durationHhMm}
          priceUsdText={form.priceUsdText}
          pricingOptionLabel={form.pricingOptionLabel}
          scheduleMode={form.scheduleMode}
          scheduledDateYyyyMmDd={form.scheduledDateYyyyMmDd}
          scheduledStartTime12h={form.scheduledStartTime12h}
          serviceName={form.serviceName}
          vehicleMake={form.vehicleMake}
          vehicleModel={form.vehicleModel}
          vehicleYear={form.vehicleYear}
          onBusinessNoteChange={form.setBusinessNote}
        />
      );
    default:
      return null;
  }
}
