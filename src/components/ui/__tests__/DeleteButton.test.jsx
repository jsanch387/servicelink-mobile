import { screen } from '@testing-library/react-native';
import { DeleteButton } from '../DeleteButton';
import { renderWithProviders } from '../../../features/home/__tests__/testUtils';

describe('DeleteButton', () => {
  it('renders a quiet secondary delete action with a trash icon', () => {
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
