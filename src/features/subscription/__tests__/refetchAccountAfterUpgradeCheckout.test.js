import { queryClient } from '../../../lib/queryClient';
import { accountSettingsQueryKey } from '../../more/queryKeys';
import { refetchAccountAfterUpgradeCheckout } from '../utils/refetchAccountAfterUpgradeCheckout';

jest.mock('../../../lib/queryClient', () => ({
  queryClient: {
    refetchQueries: jest.fn(),
    getQueryData: jest.fn(),
    invalidateQueries: jest.fn(),
  },
}));

describe('refetchAccountAfterUpgradeCheckout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.refetchQueries.mockResolvedValue(undefined);
    queryClient.invalidateQueries.mockResolvedValue(undefined);
  });

  it('stops polling once profile shows Pro access', async () => {
    queryClient.getQueryData
      .mockReturnValueOnce({
        ownerProfile: { subscription_tier: 'free', stripe_subscription_id: null },
      })
      .mockReturnValueOnce({
        ownerProfile: {
          subscription_tier: 'pro',
          subscription_status: 'active',
          stripe_subscription_id: 'sub_1',
        },
      });

    const result = await refetchAccountAfterUpgradeCheckout({
      userId: 'user_1',
      maxAttempts: 4,
      delayMs: 0,
    });

    expect(result.hasProAccess).toBe(true);
    expect(queryClient.refetchQueries).toHaveBeenCalledTimes(2);
    expect(queryClient.refetchQueries).toHaveBeenCalledWith({
      queryKey: accountSettingsQueryKey('user_1'),
    });
  });

  it('returns false when Pro never appears within attempts', async () => {
    queryClient.getQueryData.mockReturnValue({
      ownerProfile: { subscription_tier: 'free', stripe_subscription_id: null },
    });

    const result = await refetchAccountAfterUpgradeCheckout({
      userId: 'user_1',
      maxAttempts: 2,
      delayMs: 0,
    });

    expect(result.hasProAccess).toBe(false);
    expect(queryClient.refetchQueries).toHaveBeenCalledTimes(2);
  });
});
