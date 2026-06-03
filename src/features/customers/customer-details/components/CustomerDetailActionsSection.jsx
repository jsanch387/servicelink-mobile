import { BetaLabel, SettingsNavRow, SettingsSection } from '../../../../components/ui';

/** Label for the maintenance offer wizard entry point on customer profile. */
export const CUSTOMER_DETAIL_SEND_MAINTENANCE_LABEL = 'Maintenance detail';

/**
 * Grouped quick actions for a customer profile.
 *
 * @param {object} props
 * @param {() => void} props.onSendMaintenanceDetail
 * @param {() => void} props.onSendText
 * @param {boolean} [props.first]
 * @param {boolean} [props.removeLoading]
 */
export function CustomerDetailActionsSection({
  first = false,
  onSendMaintenanceDetail,
  onSendText,
  removeLoading = false,
}) {
  return (
    <SettingsSection first={first} title="Actions">
      <SettingsNavRow
        disabled={removeLoading}
        icon="chatbubble-ellipses-outline"
        label="Send a text"
        onPress={onSendText}
      />
      <SettingsNavRow
        disabled={removeLoading}
        icon="repeat-outline"
        label={CUSTOMER_DETAIL_SEND_MAINTENANCE_LABEL}
        labelAccessory={<BetaLabel />}
        showDividerBelow={false}
        onPress={onSendMaintenanceDetail}
      />
    </SettingsSection>
  );
}
