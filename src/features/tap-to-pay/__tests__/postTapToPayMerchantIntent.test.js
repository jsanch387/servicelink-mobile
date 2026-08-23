import { postTapToPayMerchantIntent } from '../api/postTapToPayMerchantIntent';

jest.mock('../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://app.example.com',
}));

jest.mock('../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

describe('postTapToPayMerchantIntent', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('posts walk-up amount and parses PaymentIntent fields', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({
        success: true,
        paymentIntentId: 'pi_walkup',
        clientSecret: 'pi_walkup_secret',
        amountCents: 4000,
        currency: 'USD',
      }),
    });

    const result = await postTapToPayMerchantIntent('token', {
      amountCents: 4000,
      note: 'Lights',
      stripeAccountId: 'acct_1',
    });

    expect(result).toEqual({
      ok: true,
      paymentIntentId: 'pi_walkup',
      clientSecret: 'pi_walkup_secret',
      amountCents: 4000,
      currency: 'usd',
      connectParams: {
        terminalLocationId: null,
        stripeAccountId: null,
        merchantDisplayName: null,
      },
      requestId: expect.any(String),
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/payments/tap-to-pay/intent',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          amountCents: 4000,
          currency: 'usd',
          note: 'Lights',
          stripeAccountId: 'acct_1',
        }),
      }),
    );
  });

  it('maps a missing walk-up route to a collect error', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      headers: { get: () => null },
      json: async () => ({ error: 'Not found' }),
    });

    const result = await postTapToPayMerchantIntent('token', { amountCents: 4000 });
    expect(result.ok).toBe(false);
    expect(result.error.message).toBe('Not found');
  });
});
