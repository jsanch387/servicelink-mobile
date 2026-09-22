import { DetailsLeadRow } from './DetailsLeadRow';
import { DetailsSectionCard } from './DetailsSectionCard';

/**
 * Service address on a detail screen. Tap opens the device maps app.
 *
 * @param {object} props
 * @param {string} props.address Street or full fallback line
 * @param {string} [props.secondary] City, ST ZIP
 * @param {() => void} [props.onPress] Omit for a read-only address
 * @param {string} [props.title]
 */
export function LocationSection({ address, secondary = '', onPress, title = 'Location' }) {
  const primary = String(address ?? '').trim();
  const locality = String(secondary ?? '').trim();
  const interactive = typeof onPress === 'function';

  return (
    <DetailsSectionCard bodyPadding="roomy" title={title}>
      <DetailsLeadRow
        accessibilityHint={interactive ? 'Opens this address in Maps' : undefined}
        accessibilityLabel={locality ? `${primary}, ${locality}` : primary}
        icon="location"
        primary={primary}
        secondary={locality}
        showChevron={interactive}
        onPress={onPress}
      />
    </DetailsSectionCard>
  );
}
