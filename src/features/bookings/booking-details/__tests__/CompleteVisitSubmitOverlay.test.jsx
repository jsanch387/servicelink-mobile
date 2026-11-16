import { act, render, screen } from '@testing-library/react-native';
import { ThemeProvider, TypographyProvider } from '../../../../theme';
import { CompleteVisitSubmitOverlay } from '../components/CompleteVisitSubmitOverlay';

function renderOverlay(phase = 'pending') {
  return render(
    <ThemeProvider initialScheme="dark">
      <TypographyProvider>
        <CompleteVisitSubmitOverlay
          phase={phase}
          successDetail="The appointment is complete."
          successTitle="Complete"
        />
      </TypographyProvider>
    </ThemeProvider>,
  );
}

describe('CompleteVisitSubmitOverlay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('advances through slower completion messages and holds the final message', () => {
    renderOverlay();

    expect(screen.getByLabelText('Completing appointment')).toBeTruthy();
    expect(screen.getByText('Completing appointment')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Saving visit details')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Sending receipt')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Sending review link')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(9000);
    });
    expect(screen.getByText('Finishing up')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(6000);
    });
    expect(screen.getByText('Finishing up')).toBeTruthy();
  });

  it('shows the server error instead of the complete checkmark', () => {
    render(
      <ThemeProvider initialScheme="dark">
        <TypographyProvider>
          <CompleteVisitSubmitOverlay
            errorDetail="Payment is still due on this booking."
            errorTitle="Could not complete"
            phase="error"
            successDetail="The appointment is complete."
            successTitle="Complete"
          />
        </TypographyProvider>
      </ThemeProvider>,
    );

    expect(screen.getByText('Could not complete')).toBeTruthy();
    expect(screen.getByText('Payment is still due on this booking.')).toBeTruthy();
    expect(screen.queryByText('Complete')).toBeNull();
    expect(screen.queryByLabelText('Visit completed')).toBeNull();
  });
});
