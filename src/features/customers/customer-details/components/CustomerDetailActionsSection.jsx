import { SettingsNavRow, SettingsSection } from '../../../../components/ui';
import { customerDetailMaintenanceActionLabel } from '../../../maintenance/utils/maintenanceEnrollmentUtils';

/**
 * Grouped quick actions for a customer profile.
 *
 * @param {object} props
 * @param {import('../../api/fetchCustomersApi').CustomerMaintenanceEnrollmentSummary | null} props.maintenanceEnrollment
 * @param {() => void} props.onOpenMaintenanceDetail
 * @param {() => void} props.onSendMaintenanceInvite
 * @param {() => void} props.onSendText
 * @param {boolean} [props.first]
 * @param {boolean} [props.removeLoading]
 */
export function CustomerDetailActionsSection({
  first = false,
  maintenanceEnrollment,
  onOpenMaintenanceDetail,
  onSendMaintenanceInvite,
  onSendText,
  removeLoading = false,
}) {
  const hasEnrollment = Boolean(maintenanceEnrollment?.enrollmentId);
  const maintenanceLabel = customerDetailMaintenanceActionLabel(maintenanceEnrollment);

  const maintenanceOnPress = hasEnrollment ? onOpenMaintenanceDetail : onSendMaintenanceInvite;

  const blocked = removeLoading;

  return (
    <SettingsSection first={first} title="Actions">
      <SettingsNavRow
        disabled={blocked}
        icon="chatbubble-ellipses-outline"
        label="Send a text"
        onPress={onSendText}
      />
      <SettingsNavRow
        disabled={blocked}
        icon="construct-outline"
        label={maintenanceLabel}
        showDividerBelow={false}
        onPress={maintenanceOnPress}
      />
    </SettingsSection>
  );
}
