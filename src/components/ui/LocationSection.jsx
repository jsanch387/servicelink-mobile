import { DetailIconFieldRow } from './DetailIconFieldRow';
import { DetailsSectionCard } from './DetailsSectionCard';

/**
 * Service address on a detail screen. Tap opens the device maps app.
 *
 * @param {object} props
 * @param {string} props.address
 * @param {() => void} [props.onPress] Omit for a read-only address.
 * @param {string} [props.title]
 */
export function LocationSection({ address, onPress, title = 'Location' }) {
  const interactive = typeof onPress === 'function';

  return (
    <DetailsSectionCard bodyPadding="roomy" title={title}>
      <DetailIconFieldRow
        accessibilityHint={interactive ? 'Opens this address in Maps' : undefined}
        icon="location-outline"
        label={interactive ? 'Open in Maps' : 'Address'}
        labelUppercase={false}
        value={address}
        onPress={onPress}
      />
    </DetailsSectionCard>
  );
}
