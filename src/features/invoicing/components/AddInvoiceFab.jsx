import { FloatingActionButton } from '../../../components/ui';

/**
 * @param {object} props
 * @param {() => void} props.onPress
 * @param {number} [props.bottom]
 */
export function AddInvoiceFab({ onPress, bottom = 30 }) {
  return (
    <FloatingActionButton
      accessibilityHint="Starts a new invoice"
      accessibilityLabel="Create invoice"
      bottom={bottom}
      iconName="document-text-outline"
      onPress={onPress}
    />
  );
}
