import { SettingsNavRow, SettingsSection } from '../../../../components/ui';

/**
 * Grouped quick actions for a customer profile.
 *
 * @param {object} props
 * @param {() => void} props.onSendText
 * @param {() => void} [props.onViewSubscription]
 * @param {boolean} [props.first]
 * @param {boolean} [props.removeLoading]
 */
export function CustomerDetailActionsSection({
  first = false,
  onSendText,
  onViewSubscription = null,
  removeLoading = false,
}) {
  return (
    <SettingsSection first={first} title="Actions">
      <SettingsNavRow
        disabled={removeLoading}
        icon="chatbubble-ellipses-outline"
        label="Send a text"
        showDividerBelow={Boolean(onViewSubscription)}
        onPress={onSendText}
      />
      {onViewSubscription ? (
        <SettingsNavRow
          disabled={removeLoading}
          icon="layers-outline"
          label="Subscription"
          showDividerBelow={false}
          onPress={onViewSubscription}
        />
      ) : null}
    </SettingsSection>
  );
}
