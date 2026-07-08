import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider, TypographyProvider } from '../../../../theme';
import { CreateAppointmentSubmittingState } from '../components/CreateAppointmentSubmittingState';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

function renderState(props) {
  return render(
    <ThemeProvider initialScheme="dark">
      <TypographyProvider>
        <CreateAppointmentSubmittingState {...props} />
      </TypographyProvider>
    </ThemeProvider>,
  );
}

describe('CreateAppointmentSubmittingState', () => {
  it('shows cycling submit copy while active', () => {
    renderState({ active: true, error: null, hasCustomerPhone: false });

    expect(screen.getByLabelText('Creating appointment')).toBeTruthy();
    expect(screen.getByText('Submitting')).toBeTruthy();
  });

  it('shows shared submit error outcome when submit fails', () => {
    const onRetryFromError = jest.fn();
    renderState({
      active: false,
      error: 'Could not create booking. Try again.',
      hasCustomerPhone: false,
      onRetryFromError,
    });

    expect(screen.getByText("Couldn't create appointment")).toBeTruthy();
    expect(screen.getByText('Could not create booking. Try again.')).toBeTruthy();
    fireEvent.press(screen.getByText('Back to review'));
    expect(onRetryFromError).toHaveBeenCalled();
  });
});
