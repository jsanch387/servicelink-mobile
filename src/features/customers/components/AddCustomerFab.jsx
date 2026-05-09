import { FloatingActionButton } from '../../../components/ui';

/**
 * Wrapper for customer icon/copy; shared geometry lives in `FloatingActionButton`.
 */
export function AddCustomerFab({ onPress, bottom = 30 }) {
  return (
    <FloatingActionButton
      accessibilityHint="Opens a form to add a new customer"
      accessibilityLabel="Add customer"
      bottom={bottom}
      iconName="person-outline"
      onPress={onPress}
    />
  );
}
