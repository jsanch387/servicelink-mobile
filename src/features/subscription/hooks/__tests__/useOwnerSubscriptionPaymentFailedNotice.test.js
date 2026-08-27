import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOwnerSubscriptionPaymentFailedNotice } from '../useOwnerSubscriptionPaymentFailedNotice';

const pastDueProfile = {
  subscription_tier: 'pro',
  subscription_status: 'past_due',
  stripe_subscription_id: 'sub_1',
  subscription_current_period_end: '2026-09-01',
};

describe('useOwnerSubscriptionPaymentFailedNotice', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('is hidden for active Pro', async () => {
    const { result } = renderHook(() =>
      useOwnerSubscriptionPaymentFailedNotice({
        enabled: true,
        ownerProfile: {
          subscription_tier: 'pro',
          subscription_status: 'active',
          stripe_subscription_id: 'sub_1',
        },
      }),
    );
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.visible).toBe(false);
  });

  it('shows for past_due and stays dismissed after close', async () => {
    const { result } = renderHook(() =>
      useOwnerSubscriptionPaymentFailedNotice({
        enabled: true,
        ownerProfile: pastDueProfile,
      }),
    );
    await waitFor(() => expect(result.current.visible).toBe(true));
    await act(async () => {
      await result.current.dismiss();
    });
    expect(result.current.visible).toBe(false);
  });
});
