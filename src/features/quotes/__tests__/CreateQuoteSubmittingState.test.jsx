import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider, TypographyProvider } from '../../../theme';
import { CreateQuoteSubmittingState } from '../components/create-quote/CreateQuoteSubmittingState';

function renderState(props) {
  return render(
    <ThemeProvider initialScheme="dark">
      <TypographyProvider>
        <CreateQuoteSubmittingState {...props} />
      </TypographyProvider>
    </ThemeProvider>,
  );
}

describe('CreateQuoteSubmittingState', () => {
  it('shows only submission progress while sending', () => {
    renderState({ error: null, onBackToReview: jest.fn() });

    expect(screen.getByLabelText('Sending quote')).toBeTruthy();
    expect(screen.getByText('Sending quote')).toBeTruthy();
    expect(screen.queryByText('Back to review')).toBeNull();
  });

  it('shows a recoverable error that returns to review', () => {
    const onBackToReview = jest.fn();
    renderState({ error: 'Could not send. Try again.', onBackToReview });

    expect(screen.getByText("Couldn't send quote")).toBeTruthy();
    expect(screen.getByText('Could not send. Try again.')).toBeTruthy();
    fireEvent.press(screen.getByText('Back to review'));
    expect(onBackToReview).toHaveBeenCalledTimes(1);
  });
});
