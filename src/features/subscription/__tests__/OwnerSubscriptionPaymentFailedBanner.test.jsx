import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { OwnerSubscriptionPaymentFailedBanner } from '../components/OwnerSubscriptionPaymentFailedBanner';
import {
  OWNER_PAYMENT_FAILED_NOTICE_BODY,
  OWNER_PAYMENT_FAILED_NOTICE_DISMISS_LABEL,
  OWNER_PAYMENT_FAILED_NOTICE_TITLE,
} from '../constants/ownerPaymentFailedCopy';

describe('OwnerSubscriptionPaymentFailedBanner', () => {
  it('renders heads-up copy and dismisses', () => {
    const onDismiss = jest.fn();
    renderWithProviders(<OwnerSubscriptionPaymentFailedBanner onDismiss={onDismiss} />);
    expect(screen.getByText(OWNER_PAYMENT_FAILED_NOTICE_TITLE)).toBeTruthy();
    expect(screen.getByText(OWNER_PAYMENT_FAILED_NOTICE_BODY)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(OWNER_PAYMENT_FAILED_NOTICE_DISMISS_LABEL));
    expect(onDismiss).toHaveBeenCalled();
  });
});
