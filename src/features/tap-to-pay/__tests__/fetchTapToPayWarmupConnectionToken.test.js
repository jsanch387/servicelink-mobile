import { fetchTapToPayWarmupConnectionToken } from '../api/fetchTapToPayWarmupConnectionToken';

jest.mock('../api/postTapToPayMerchantConnectionToken', () => ({
  postTapToPayMerchantConnectionToken: jest.fn(),
}));

jest.mock('../api/postTapToPayConnectionToken', () => ({
  postTapToPayConnectionToken: jest.fn(),
}));

jest.mock('../api/fetchTapToPayWarmupBookingId', () => ({
  fetchTapToPayWarmupBookingId: jest.fn(),
}));

const {
  postTapToPayMerchantConnectionToken,
} = require('../api/postTapToPayMerchantConnectionToken');
const { postTapToPayConnectionToken } = require('../api/postTapToPayConnectionToken');
const { fetchTapToPayWarmupBookingId } = require('../api/fetchTapToPayWarmupBookingId');

describe('fetchTapToPayWarmupConnectionToken', () => {
  const warmupBookingIdRef = { current: null };

  beforeEach(() => {
    warmupBookingIdRef.current = null;
    postTapToPayMerchantConnectionToken.mockReset();
    postTapToPayConnectionToken.mockReset();
    fetchTapToPayWarmupBookingId.mockReset();
  });

  it('uses merchant token when merchant API is available', async () => {
    postTapToPayMerchantConnectionToken.mockResolvedValue({
      ok: true,
      secret: 'pst_merchant',
    });

    const secret = await fetchTapToPayWarmupConnectionToken({
      accessToken: 'token',
      stripeAccountId: 'acct_123',
      businessId: 'biz-1',
      warmupBookingIdRef,
    });

    expect(secret).toBe('pst_merchant');
    expect(postTapToPayConnectionToken).not.toHaveBeenCalled();
  });

  it('falls back to booking token when merchant API returns 404', async () => {
    postTapToPayMerchantConnectionToken.mockResolvedValue({
      ok: false,
      httpStatus: 404,
      error: new Error('Tap to Pay warm-up API is not available on the server yet.'),
    });
    fetchTapToPayWarmupBookingId.mockResolvedValue('booking-9');
    postTapToPayConnectionToken.mockResolvedValue({
      ok: true,
      secret: 'pst_booking',
    });

    const secret = await fetchTapToPayWarmupConnectionToken({
      accessToken: 'token',
      stripeAccountId: 'acct_123',
      businessId: 'biz-1',
      warmupBookingIdRef,
    });

    expect(secret).toBe('pst_booking');
    expect(postTapToPayConnectionToken).toHaveBeenCalledWith('token', 'booking-9', {
      stripeAccountId: 'acct_123',
    });
    expect(warmupBookingIdRef.current).toBe('booking-9');
  });

  it('throws when merchant API is missing and no booking exists', async () => {
    postTapToPayMerchantConnectionToken.mockResolvedValue({
      ok: false,
      httpStatus: 404,
      error: new Error('Tap to Pay warm-up API is not available on the server yet.'),
    });
    fetchTapToPayWarmupBookingId.mockResolvedValue(null);

    await expect(
      fetchTapToPayWarmupConnectionToken({
        accessToken: 'token',
        stripeAccountId: 'acct_123',
        businessId: 'biz-1',
        warmupBookingIdRef,
      }),
    ).rejects.toThrow(/merchant connection-token API or a booking/);
  });
});
