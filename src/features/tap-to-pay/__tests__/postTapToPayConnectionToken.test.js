import { postTapToPayConnectionToken } from '../api/postTapToPayConnectionToken';

jest.mock('../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://app.example.com',
}));

jest.mock('../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

describe('postTapToPayConnectionToken', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('posts to connection-token route and returns secret', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ success: true, secret: 'pst_test_secret' }),
    });

    const result = await postTapToPayConnectionToken('token', 'booking-1');

    expect(result).toEqual({
      ok: true,
      secret: 'pst_test_secret',
      requestId: expect.any(String),
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/availability/bookings/booking-1/tap-to-pay/connection-token',
      expect.objectContaining({ method: 'POST', body: '{}' }),
    );
  });

  it('includes stripeAccountId in body when provided', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ success: true, secret: 'pst_test_secret' }),
    });

    await postTapToPayConnectionToken('token', 'booking-1', {
      stripeAccountId: 'acct_123',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ stripeAccountId: 'acct_123' }),
      }),
    );
  });
});
