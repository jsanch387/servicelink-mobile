import { fireEvent, screen } from '@testing-library/react-native';
import { FloatingCreateMenu } from '../components/FloatingCreateMenu';
import { renderWithProviders } from './testUtils';

describe('FloatingCreateMenu', () => {
  it('opens the create menu without a payment highlight', () => {
    renderWithProviders(
      <FloatingCreateMenu
        showCreatePayment
        onCreateAppointment={jest.fn()}
        onCreatePayment={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByLabelText('Open create menu'));

    expect(screen.getByLabelText('Create payment')).toBeTruthy();
    expect(screen.queryByText('New')).toBeNull();
  });
});
