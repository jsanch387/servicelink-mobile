import { fireEvent, screen } from '@testing-library/react-native';
import { TotalScheduledCard } from '../components/TotalScheduledCard';
import { ROUTES } from '../../../routes/routes';
import { renderWithProviders } from './testUtils';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('TotalScheduledCard', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('shows skeleton while loading', () => {
    renderWithProviders(
      <TotalScheduledCard bookingsError={null} businessError={null} count={0} isLoading />,
    );
    expect(screen.queryByText('0')).toBeNull();
  });

  it('shows singular label for count 1', () => {
    renderWithProviders(
      <TotalScheduledCard bookingsError={null} businessError={null} count={1} isLoading={false} />,
    );
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('Scheduled appointment')).toBeTruthy();
  });

  it('shows plural label for multiple', () => {
    renderWithProviders(
      <TotalScheduledCard bookingsError={null} businessError={null} count={3} isLoading={false} />,
    );
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('Scheduled appointments')).toBeTruthy();
  });

  it('navigates to Bookings when pressed', () => {
    renderWithProviders(
      <TotalScheduledCard bookingsError={null} businessError={null} count={2} isLoading={false} />,
    );
    fireEvent.press(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.BOOKINGS);
  });

  it('does not navigate when loading', () => {
    renderWithProviders(
      <TotalScheduledCard bookingsError={null} businessError={null} count={0} isLoading />,
    );
    fireEvent.press(screen.getByRole('button'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
