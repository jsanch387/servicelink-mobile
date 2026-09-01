import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider, TypographyProvider } from '../../../../theme';
import { ReviewPaymentChoice } from '../components/ReviewPaymentChoice';
import { REVIEW_PAYMENT_CHOICE } from '../utils/resolveReviewDepositOffer';

function renderChoice(props) {
  return render(
    <ThemeProvider initialScheme="dark">
      <TypographyProvider>
        <ReviewPaymentChoice depositUsd={50} {...props} />
      </TypographyProvider>
    </ThemeProvider>,
  );
}

describe('ReviewPaymentChoice', () => {
  it('shows the deposit amount and defaults to no payment now', () => {
    renderChoice();

    expect(screen.getByText('Payment')).toBeTruthy();
    expect(screen.getByText('No payment now')).toBeTruthy();
    expect(screen.getByText('Send a deposit link')).toBeTruthy();
    expect(screen.getByText('$50 · we’ll text or email them')).toBeTruthy();
    expect(screen.queryByText(/Booking confirms when they pay/)).toBeNull();
  });

  it('calls onChangeChoice when a row is pressed', () => {
    const onChangeChoice = jest.fn();
    renderChoice({ onChangeChoice });

    fireEvent.press(screen.getByTestId('review-payment-choice-deposit'));
    expect(onChangeChoice).toHaveBeenCalledWith(REVIEW_PAYMENT_CHOICE.DEPOSIT);
  });

  it('explains the hold when deposit is selected', () => {
    renderChoice({ choice: REVIEW_PAYMENT_CHOICE.DEPOSIT });

    expect(screen.getByText('We’ll send the link. Booking confirms when they pay.')).toBeTruthy();
  });
});
