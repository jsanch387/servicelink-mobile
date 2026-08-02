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

describe('BookingActionsSection job status', () => {
  it('shows Job status when enabled and calls onJobStatusPress', () => {
    const onJobStatusPress = jest.fn();
    renderSection({ showJobStatusAction: true, onJobStatusPress });
    expect(screen.getByLabelText('Job status')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Job status'));
    expect(onJobStatusPress).toHaveBeenCalledTimes(1);
  });

  it('hides Job status when showJobStatusAction is false', () => {
    renderSection({ showJobStatusAction: false });
    expect(screen.queryByLabelText('Job status')).toBeNull();
  });

  it('still shows lifecycle tiles', () => {
    renderSection({ showJobStatusAction: true });
    expect(screen.getByLabelText('Reschedule booking')).toBeTruthy();
    expect(screen.getByLabelText('Edit booking')).toBeTruthy();
  });
});
