import { DetailIconFieldRow, DetailsSectionCard } from '../../../../components/ui';

/**
 * Entry to booking activity. Same titled field-row pattern as Schedule / Location.
 *
 * @param {object} props
 * @param {() => void} props.onPress
 */
export function BookingActivitySection({ onPress }) {
  return (
    <DetailsSectionCard bodyPadding="roomy" title="Activity">
      <DetailIconFieldRow
        accessibilityHint="See reminders, receipts, and reviews sent to the customer"
        icon="notifications-outline"
        label="Customer updates"
        labelUppercase={false}
        value="Reminders, receipts, and reviews"
        onPress={onPress}
      />
    </DetailsSectionCard>
  );
}
