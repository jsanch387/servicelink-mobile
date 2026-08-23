import {
  mapCreatePaymentLinkHttpError,
  postCreatePaymentLink,
} from '../create-payment/api/postCreatePaymentLink';

jest.mock('../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://app.example.com',
}));

jest.mock('../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

describe('postCreatePaymentLink', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('posts amount and note and reads the Stripe url', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({
        success: true,
        url: 'https://checkout.stripe.com/c/pay/cs_test_1',
        paymentLinkId: 'cs_test_1',
        paymentRequestId: 'pr_1',
      }),
    });

    const result = await postCreatePaymentLink('token', {
      amountCents: 4000,
      note: 'Lights',
    });

    expect(result).toEqual({
      ok: true,
      url: 'https://checkout.stripe.com/c/pay/cs_test_1',
      paymentLinkId: 'cs_test_1',
      paymentRequestId: 'pr_1',
      requestId: expect.any(String),
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/payments/link',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          amountCents: 4000,
          currency: 'usd',
          note: 'Lights',
        }),
      }),
    );
  });

  it('maps 404 to a missing-business error', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      headers: { get: () => null },
      json: async () => ({}),
    });

    const result = await postCreatePaymentLink('token', { amountCents: 4000, note: 'Lights' });
    expect(result.ok).toBe(false);
    expect(result.error.message).toBe('Business profile not found.');
  });

  it('maps 422 to a Connect setup error', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 422,
      headers: { get: () => null },
      json: async () => ({}),
    });

    const result = await postCreatePaymentLink('token', { amountCents: 4000, note: 'Lights' });
    expect(result.ok).toBe(false);
    expect(result.error.message).toBe('Set up Stripe payments to create a payment link.');
  });

  it('maps 429 and reads Retry-After', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: (name) => (String(name).toLowerCase() === 'retry-after' ? '12' : null) },
      json: async () => ({}),
    });

    const result = await postCreatePaymentLink('token', { amountCents: 4000, note: 'Lights' });
    expect(result.ok).toBe(false);
    expect(result.error.message).toBe('Too many payment links. Please wait a moment and try again.');
    expect(result.retryAfterSec).toBe(12);
  });

  it('rejects amounts below Stripe’s $0.50 minimum', async () => {
    const result = await postCreatePaymentLink('token', { amountCents: 49, note: 'Lights' });
    expect(result.ok).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('mapCreatePaymentLinkHttpError', () => {
  it('prefers the server message', () => {
    expect(mapCreatePaymentLinkHttpError(400, 'Add a short note.')).toBe('Add a short note.');
  });
});
