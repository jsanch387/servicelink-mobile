import { FloatingActionButton } from '../../../components/ui';

export function AddExpenseFab({ onPress, bottom = 30 }) {
  return (
    <FloatingActionButton
      accessibilityHint="Opens a form to add an expense"
      accessibilityLabel="Add expense"
      bottom={bottom}
      iconName="receipt-outline"
      onPress={onPress}
    />
  );
}
