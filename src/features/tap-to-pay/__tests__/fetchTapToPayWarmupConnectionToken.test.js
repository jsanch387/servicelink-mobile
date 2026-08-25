import { fetchTapToPayWarmupConnectionToken } from '../api/fetchTapToPayWarmupConnectionToken';

jest.mock('../api/postTapToPayMerchantConnectionToken', () => ({
  postTapToPayMerchantConnectionToken: jest.fn(),
}));

const {
  postTapToPayMerchantConnectionToken,
} = require('../api/postTapToPayMerchantConnectionToken');

describe('fetchTapToPayWarmupConnectionToken', () => {
  beforeEach(() => {
    postTapToPayMerchantConnectionToken.mockReset();
  });

  it('uses the merchant token', async () => {
    postTapToPayMerchantConnectionToken.mockResolvedValue({
      ok: true,
      secret: 'pst_merchant',
    });

    const secret = await fetchTapToPayWarmupConnectionToken({
      accessToken: 'token',
      stripeAccountId: 'acct_123',
    });

    expect(secret).toBe('pst_merchant');
    expect(postTapToPayMerchantConnectionToken).toHaveBeenCalledWith('token', {
      stripeAccountId: 'acct_123',
    });
  });

  it('throws when the merchant API returns no business', async () => {
    postTapToPayMerchantConnectionToken.mockResolvedValue({
      ok: false,
      httpStatus: 404,
      error: new Error('Business profile not found'),
    });

    await expect(
      fetchTapToPayWarmupConnectionToken({
        accessToken: 'token',
        stripeAccountId: 'acct_123',
      }),
    ).rejects.toThrow('Business profile not found');
  });
});
