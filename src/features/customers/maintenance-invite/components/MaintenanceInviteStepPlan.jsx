import { DurationSelectField, SurfaceTextField } from '../../../../components/ui';
import { MAINTENANCE_PRICE_INPUT_MAX } from '../constants';
import { MaintenanceInviteFieldLabel } from './MaintenanceInviteFieldLabel';
import { MaintenanceInviteFieldStack } from './MaintenanceInviteFieldStack';
import { normalizeMaintenancePriceInput } from '../utils/maintenanceInviteFormUtils';

const FIELD_SHELL = { marginBottom: 0 };
const DURATION_SHELL = { marginBottom: 0, marginTop: 0 };
const PRICE_DISPLAY_MAX = 1 + MAINTENANCE_PRICE_INPUT_MAX;

/**
 * @param {object} props
 * @param {string} props.customerName
 * @param {string} props.priceUsdText
 * @param {(t: string) => void} props.onPriceUsdTextChange
 * @param {string} props.durationHhMm
 * @param {(t: string) => void} props.onDurationHhMmChange
 */
export function MaintenanceInviteStepPlan({
  customerName,
  priceUsdText,
  onPriceUsdTextChange,
  durationHhMm,
  onDurationHhMmChange,
}) {
  return (
    <MaintenanceInviteFieldStack>
      <SurfaceTextField
        containerStyle={FIELD_SHELL}
        editable={false}
        label="Customer"
        value={customerName}
      />

      <SurfaceTextField
        containerStyle={FIELD_SHELL}
        keyboardType="decimal-pad"
        label={<MaintenanceInviteFieldLabel required text="Price per visit" />}
        maxLength={PRICE_DISPLAY_MAX}
        onChangeText={(t) => onPriceUsdTextChange(normalizeMaintenancePriceInput(t))}
        placeholder="e.g. 100"
        value={priceUsdText ? `$${priceUsdText}` : ''}
      />

      <DurationSelectField
        containerStyle={DURATION_SHELL}
        label={<MaintenanceInviteFieldLabel required text="Service duration" />}
        mode="service"
        onValueChange={onDurationHhMmChange}
        placeholder="Select duration"
        value={durationHhMm}
      />
    </MaintenanceInviteFieldStack>
  );
}
