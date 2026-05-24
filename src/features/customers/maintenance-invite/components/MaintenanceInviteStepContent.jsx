import { StyleSheet } from 'react-native';
import { SurfaceCard } from '../../../../components/ui';
import { MAINTENANCE_INVITE_WRAP_INPUT_STEPS_IN_SURFACE_CARD } from '../constants';
import { MaintenanceInviteStepPlan } from './MaintenanceInviteStepPlan';
import { MaintenanceInviteStepReview } from './MaintenanceInviteStepReview';
import { MaintenanceInviteStepSchedule } from './MaintenanceInviteStepSchedule';

const inputSurfacePad = StyleSheet.create({
  surface: {
    paddingBottom: 30,
    paddingHorizontal: 14,
    paddingTop: 30,
  },
});

function wrapInputStepSurface(node) {
  if (!MAINTENANCE_INVITE_WRAP_INPUT_STEPS_IN_SURFACE_CARD) {
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
export function MaintenanceInviteStepContent({ stepIndex, form }) {
  switch (stepIndex) {
    case 0:
      return wrapInputStepSurface(
        <MaintenanceInviteStepPlan
          customerName={form.customerName}
          durationHhMm={form.durationHhMm}
          priceUsdText={form.priceUsdText}
          onDurationHhMmChange={form.setDurationHhMm}
          onPriceUsdTextChange={form.setPriceUsdText}
        />,
      );
    case 1:
      return wrapInputStepSurface(
        <MaintenanceInviteStepSchedule
          preferredDateYyyyMmDd={form.preferredDateYyyyMmDd}
          preferredTime12h={form.preferredTime12h}
          onPreferredDateChange={form.setPreferredDateYyyyMmDd}
          onPreferredTimeChange={form.setPreferredTime12h}
        />,
      );
    case 2:
      return (
        <MaintenanceInviteStepReview
          customerEmail={form.customerEmail}
          customerName={form.customerName}
          durationHhMm={form.durationHhMm}
          preferredDateYyyyMmDd={form.preferredDateYyyyMmDd}
          preferredTime12h={form.preferredTime12h}
          priceUsdText={form.priceUsdText}
        />
      );
    default:
      return null;
  }
}
