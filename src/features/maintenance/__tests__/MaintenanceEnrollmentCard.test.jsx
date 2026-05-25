import { fireEvent, screen } from '@testing-library/react-native';
import { MaintenanceEnrollmentCard } from '../components/MaintenanceEnrollmentCard';
import { renderWithProviders } from '../../home/__tests__/testUtils';

describe('MaintenanceEnrollmentCard', () => {
  it('renders customer name, price line, and status pill', () => {
    renderWithProviders(
      <MaintenanceEnrollmentCard
        customerName="Alex Rivera"
        line="$100 · 2 hrs"
        statusLabel="Confirmed"
        statusRaw="accepted"
      />,
    );

    expect(screen.getByText('Alex Rivera')).toBeTruthy();
    expect(screen.getByText('$100 · 2 hrs')).toBeTruthy();
    expect(screen.getByText('Confirmed')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const onPress = jest.fn();
    renderWithProviders(
      <MaintenanceEnrollmentCard
        customerName="Alex Rivera"
        line="$100 · 2 hrs"
        statusLabel="Completed"
        statusRaw="visit_completed"
        onPress={onPress}
      />,
    );

    fireEvent.press(screen.getByLabelText('Maintenance for Alex Rivera'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows completed status label with completed styling raw key', () => {
    renderWithProviders(
      <MaintenanceEnrollmentCard
        customerName="Jamie Chen"
        line="$80 · 1 hr"
        statusLabel="Completed"
        statusRaw="visit_completed"
      />,
    );

    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText('Jamie Chen')).toBeTruthy();
  });
});
