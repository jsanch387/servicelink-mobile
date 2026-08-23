import { DetailIconFieldRow, DetailsSectionCard } from '../../../../components/ui';

/**
 * Service address. Tap opens Maps.
 *
 * @param {object} props
 * @param {string} props.address
 * @param {() => void} props.onPress
 */
export function BookingLocationSection({ address, onPress }) {
  return (
    <DetailsSectionCard bodyPadding="roomy" title="Location">
      <DetailIconFieldRow
        accessibilityHint="Opens this address in Maps"
        icon="location-outline"
        label="Open in Maps"
        labelUppercase={false}
        value={address}
        onPress={onPress}
      />
    </DetailsSectionCard>
  );
}
