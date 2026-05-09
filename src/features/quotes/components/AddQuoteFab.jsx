import { FloatingActionButton } from '../../../components/ui';

/**
 * Wrapper for quote icon/copy; shared geometry lives in `FloatingActionButton`.
 */
export function AddQuoteFab({ onPress, bottom = 30 }) {
  return (
    <FloatingActionButton
      accessibilityHint="Opens create quote form"
      accessibilityLabel="Create quote"
      bottom={bottom}
      iconName="receipt-outline"
      onPress={onPress}
    />
  );
}
