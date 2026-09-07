import { DetailIconFieldRow, DetailsSectionCard } from '../../../../components/ui';

/**
 * Tappable entry to the customer-updates list. Copy invites them in;
 * the list itself shows each confirmation, reminder, and status.
 *
 * @param {object} props
 * @param {() => void} props.onPress
 */
export function BookingActivitySection({ onPress }) {
  return (
    <DetailsSectionCard bodyPadding="roomy" title="Customer updates">
      <DetailIconFieldRow
        accessibilityHint="See texts and emails we sent your customer"
        icon="chatbubble-ellipses-outline"
        label="See what we sent"
        labelUppercase={false}
        value="Confirmations, reminders, and more"
        onPress={onPress}
      />
    </DetailsSectionCard>
  );
}
