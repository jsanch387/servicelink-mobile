import { postTapToPayIntent } from '../api/postTapToPayIntent';

jest.mock('../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://app.example.com',
}));

jest.mock('../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

describe('postTapToPayIntent', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('posts sessionFees and parses PaymentIntent fields', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({
        success: true,
        paymentIntentId: 'pi_abc',
        clientSecret: 'pi_abc_secret_xyz',
        amountCents: 12000,
        currency: 'USD',
      }),
    });

    const result = await postTapToPayIntent('token', 'booking-1', [
      { label: 'Pet hair', amountCents: 2500 },
    ]);

    expect(result).toEqual({
      ok: true,
      paymentIntentId: 'pi_abc',
      clientSecret: 'pi_abc_secret_xyz',
      amountCents: 12000,
      currency: 'usd',
      connectParams: {
        terminalLocationId: null,
        stripeAccountId: null,
        merchantDisplayName: null,
      },
      requestId: expect.any(String),
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/availability/bookings/booking-1/tap-to-pay/intent',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          sessionFees: [{ label: 'Pet hair', amountCents: 2500 }],
        }),
      }),
    );
  });

  it('maps server error messages', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 422,
      headers: { get: () => null },
      json: async () => ({ success: false, error: 'Set up Stripe payments to use Tap to Pay.' }),
    });

    const result = await postTapToPayIntent('token', 'booking-1', []);

    expect(result.ok).toBe(false);
    expect(result.error.message).toBe('Set up Stripe payments to use Tap to Pay.');
    expect(result.httpStatus).toBe(422);
  });
});
