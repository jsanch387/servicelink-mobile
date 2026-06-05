import { FloatingActionButton } from '../../../components/ui';

export function AddCategoryFab({ onPress, bottom = 30 }) {
  return (
    <FloatingActionButton
      accessibilityHint="Opens a form to add a new category"
      accessibilityLabel="Add category"
      bottom={bottom}
      iconName="add"
      showBadge={false}
      onPress={onPress}
    />
  );
}
