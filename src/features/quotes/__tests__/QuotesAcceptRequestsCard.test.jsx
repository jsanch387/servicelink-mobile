import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider, TypographyProvider } from '../../../theme';
import { QuotesAcceptRequestsCard } from '../components/QuotesAcceptRequestsCard';
import { quotesAcceptRequestsAccessCopy } from '../constants/quotesAccessCopy';

function renderCard(props) {
  return render(
    <ThemeProvider initialScheme="dark">
      <TypographyProvider>
        <QuotesAcceptRequestsCard value={false} onValueChange={jest.fn()} {...props} />
      </TypographyProvider>
    </ThemeProvider>,
  );
}

describe('QuotesAcceptRequestsCard', () => {
  it('explains quotes and shows a website subscribe CTA when locked', () => {
    const onWebSignInPress = jest.fn();
    renderCard({ proLocked: true, onWebSignInPress });

    expect(screen.getByText(quotesAcceptRequestsAccessCopy.cardSubtitle)).toBeTruthy();
    expect(screen.getByText(quotesAcceptRequestsAccessCopy.cardHint)).toBeTruthy();
    expect(screen.queryByLabelText('Accept quote requests from booking link')).toBeNull();

    fireEvent.press(screen.getByLabelText(quotesAcceptRequestsAccessCopy.inlineAction));
    expect(onWebSignInPress).toHaveBeenCalledTimes(1);
  });

  it('shows the booking-link toggle when unlocked', () => {
    renderCard({ proLocked: false, value: true });

    expect(screen.getByText('Show “Request a quote” on your booking link.')).toBeTruthy();
    expect(screen.getByLabelText('Accept quote requests from booking link')).toBeTruthy();
    expect(screen.queryByText(quotesAcceptRequestsAccessCopy.inlineAction)).toBeNull();
  });
});
