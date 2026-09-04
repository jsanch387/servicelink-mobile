import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { SubscriptionsBetaBanner } from '../components/SubscriptionsBetaBanner';
import {
  SUBSCRIPTIONS_BETA_BANNER_A11Y_LABEL,
  SUBSCRIPTIONS_BETA_BANNER_BODY,
  SUBSCRIPTIONS_BETA_BANNER_TITLE,
} from '../constants/setupCopy';

describe('SubscriptionsBetaBanner', () => {
  it('renders beta copy and opens contact on press', () => {
    const onPress = jest.fn();
    renderWithProviders(<SubscriptionsBetaBanner onPress={onPress} />);

    expect(screen.getByText(SUBSCRIPTIONS_BETA_BANNER_TITLE)).toBeTruthy();
    expect(screen.getByText(SUBSCRIPTIONS_BETA_BANNER_BODY)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(SUBSCRIPTIONS_BETA_BANNER_A11Y_LABEL));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
