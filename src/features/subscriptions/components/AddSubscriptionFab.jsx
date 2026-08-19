import { FloatingActionButton } from '../../../components/ui';

/**
 * Wrapper for subscription icon/copy; shared geometry lives in `FloatingActionButton`.
 */
export function AddSubscriptionFab({ onPress, bottom = 30 }) {
  return (
    <FloatingActionButton
      accessibilityHint="Opens a form to create a new subscription"
      accessibilityLabel="Add subscription"
      bottom={bottom}
      iconName="layers-outline"
      onPress={onPress}
    />
  );
}
