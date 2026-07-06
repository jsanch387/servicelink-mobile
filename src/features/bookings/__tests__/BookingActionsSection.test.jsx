import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider, TypographyProvider } from '../../../theme';
import { BookingActionsSection } from '../booking-details/components/BookingActionsSection';

function renderSection(props = {}) {
  return render(
    <ThemeProvider initialScheme="dark">
      <TypographyProvider>
        <BookingActionsSection
          onCancelBooking={jest.fn()}
          onMarkCompleted={jest.fn()}
          onReschedule={jest.fn()}
          {...props}
        />
      </TypographyProvider>
    </ThemeProvider>,
  );
}

describe('BookingActionsSection on my way', () => {
  it('shows On my way above lifecycle tiles when enabled', () => {
    renderSection({ showOnMyWayAction: true, hasCustomerSmsPhone: true });
    expect(screen.getByLabelText('On my way')).toBeTruthy();
    expect(screen.getByLabelText('Reschedule booking')).toBeTruthy();
  });

  it('shows Customer notified when already sent', () => {
    renderSection({
      showOnMyWayAction: true,
      hasCustomerSmsPhone: true,
      onMyWayAlreadySent: true,
    });
    expect(screen.getByLabelText('Customer notified')).toBeDisabled();
    expect(screen.queryByLabelText('On my way')).toBeNull();
  });

  it('hides on my way row when showOnMyWayAction is false', () => {
    renderSection({ showOnMyWayAction: false });
    expect(screen.queryByLabelText('On my way')).toBeNull();
    expect(screen.queryByLabelText('Customer notified')).toBeNull();
  });

  it('calls onOnMyWayPress when On my way is pressed', () => {
    const onOnMyWayPress = jest.fn();
    renderSection({
      showOnMyWayAction: true,
      hasCustomerSmsPhone: true,
      onOnMyWayPress,
    });
    fireEvent.press(screen.getByLabelText('On my way'));
    expect(onOnMyWayPress).toHaveBeenCalledTimes(1);
  });
});
