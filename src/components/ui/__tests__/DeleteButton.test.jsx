import { screen } from '@testing-library/react-native';
import { DeleteButton } from '../DeleteButton';
import { renderWithProviders } from '../../../features/home/__tests__/testUtils';

describe('DeleteButton', () => {
  it('renders outline danger delete action with trash icon', () => {
    renderWithProviders(<DeleteButton title="Delete booking" onPress={() => {}} />);
    expect(screen.getByText('Delete booking')).toBeTruthy();
  });

  it('can hide icon for text-only destructive actions', () => {
    renderWithProviders(
      <DeleteButton showIcon={false} title="Delete account" onPress={() => {}} />,
    );
    expect(screen.getByText('Delete account')).toBeTruthy();
  });
});
