import { FloatingActionButton } from '../../../components/ui';

export function AddAddonFab({ onPress, bottom = 30 }) {
  return (
    <FloatingActionButton
      accessibilityHint="Opens a form to add a new add-on"
      accessibilityLabel="Add add-on"
      bottom={bottom}
      iconName="add"
      showBadge={false}
      onPress={onPress}
    />
  );
}
