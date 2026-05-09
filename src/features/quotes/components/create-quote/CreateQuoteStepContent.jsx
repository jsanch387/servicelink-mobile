import { StyleSheet } from 'react-native';
import { SurfaceCard } from '../../../../components/ui';
import { CREATE_QUOTE_WRAP_INPUT_STEPS_IN_SURFACE_CARD } from '../../constants/createQuoteWizard';
import { CreateQuoteStepCustomer } from './CreateQuoteStepCustomer';
import { CreateQuoteStepReview } from './CreateQuoteStepReview';
import { CreateQuoteStepSchedule } from './CreateQuoteStepSchedule';
import { CreateQuoteStepService } from './CreateQuoteStepService';
import { CreateQuoteStepVehicle } from './CreateQuoteStepVehicle';

const inputSurfacePad = StyleSheet.create({
  surface: {
    paddingBottom: 30,
    paddingHorizontal: 14,
    paddingTop: 30,
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
 * @param {number} props.stepIndex
 * @param {object} props.form
 */
export function CreateQuoteStepContent({ stepIndex, form }) {
  switch (stepIndex) {
    case 0:
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
    case 1:
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
    case 2:
      return wrapInputStepSurface(
        <CreateQuoteStepService
          durationHhMm={form.durationHhMm}
          priceUsdText={form.priceUsdText}
          serviceName={form.serviceName}
          onDurationHhMmChange={form.setDurationHhMm}
          onPriceUsdTextChange={form.setPriceUsdText}
          onServiceNameChange={form.setServiceName}
        />,
      );
    case 3:
      return wrapInputStepSurface(
        <CreateQuoteStepSchedule
          scheduledDateYyyyMmDd={form.scheduledDateYyyyMmDd}
          scheduledStartTime12h={form.scheduledStartTime12h}
          onScheduledDateChange={form.setScheduledDateYyyyMmDd}
          onScheduledStartTimeChange={form.setScheduledStartTime12h}
        />,
      );
    case 4:
      return (
        <CreateQuoteStepReview
          businessNote={form.businessNote}
          customerEmail={form.customerEmail}
          customerName={form.customerName}
          customerPhoneDisplay={form.customerPhoneDisplay}
          customerRequestNotes={form.customerRequestNotes}
          durationHhMm={form.durationHhMm}
          priceUsdText={form.priceUsdText}
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
