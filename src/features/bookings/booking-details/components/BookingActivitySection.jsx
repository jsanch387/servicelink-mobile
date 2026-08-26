import { DetailIconFieldRow, DetailsSectionCard } from '../../../../components/ui';

/**
 * Entry to customer updates. Same titled field-row pattern as Schedule / Location.
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
        label="What we sent"
        labelUppercase={false}
        value="Texts and emails, and when"
        onPress={onPress}
      />
    </DetailsSectionCard>
  );
}
