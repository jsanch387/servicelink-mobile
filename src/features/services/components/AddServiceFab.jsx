import { FloatingActionButton } from '../../../components/ui';

export function AddServiceFab({ onPress, bottom = 30 }) {
  return (
    <FloatingActionButton
      accessibilityHint="Opens a form to add a new service"
      accessibilityLabel="Add service"
      bottom={bottom}
      iconName="briefcase-outline"
      onPress={onPress}
    />
  );
}
