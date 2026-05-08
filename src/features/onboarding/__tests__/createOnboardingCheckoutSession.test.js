jest.mock('../../../lib/webAppOrigin', () => ({
  getWebAppOrigin: jest.fn(),
}));

import { getWebAppOrigin } from '../../../lib/webAppOrigin';
import { createOnboardingCheckoutSession } from '../api/createOnboardingCheckoutSession';

describe('createOnboardingCheckoutSession', () => {
  const originalDev = global.__DEV__;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.__DEV__ = true;
    global.fetch = jest.fn();
    getWebAppOrigin.mockReturnValue('http://localhost:3000');
  });

  afterAll(() => {
    global.__DEV__ = originalDev;
    global.fetch = originalFetch;
  });

  it('POSTs contract body with Bearer token', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        url: 'https://checkout.stripe.com/c/pay/cs_test_abc',
      }),
    });

    await expect(createOnboardingCheckoutSession('jwt-token')).resolves.toEqual({
      url: 'https://checkout.stripe.com/c/pay/cs_test_abc',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/stripe/create-checkout-session',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer jwt-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'onboarding_trial_bridge',
          client: 'mobile',
        }),
      },
    );
  });

  it('returns error when access token is missing', async () => {
    const out = await createOnboardingCheckoutSession(null);
    expect(out).toEqual({
      error: expect.objectContaining({ message: expect.stringContaining('Not signed in') }),
      httpStatus: 0,
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('uses iOS simulator localhost fallback in dev when origin is empty', async () => {
    getWebAppOrigin.mockReturnValue('');
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, url: 'https://checkout.stripe.com/c/pay/cs_test_abc' }),
    });

    await createOnboardingCheckoutSession('jwt-token');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^http:\/\/localhost:3000\/api\/stripe\/create-checkout-session$/),
      expect.any(Object),
    );
  });

  it('uses production domain fallback when origin is empty in production', async () => {
    global.__DEV__ = false;
    getWebAppOrigin.mockReturnValue('');
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, url: 'https://checkout.stripe.com/c/pay/cs_test_prod' }),
    });

    await createOnboardingCheckoutSession('jwt-token');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://myservicelink.app/api/stripe/create-checkout-session',
      expect.any(Object),
    );
  });

  it('rejects insecure production origins', async () => {
    global.__DEV__ = false;
    getWebAppOrigin.mockReturnValue('http://localhost:3000');

    const out = await createOnboardingCheckoutSession('jwt-token');
    expect(out).toEqual({
      error: expect.objectContaining({
        message: 'Production checkout requires an https web origin',
      }),
      httpStatus: 0,
    });
    expect(out.httpStatus).toBe(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns error on 401 with server message', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ success: false, error: 'Unauthorized' }),
    });

    const out = await createOnboardingCheckoutSession('bad-token');
    expect(out).toEqual({
      error: expect.objectContaining({ message: 'Unauthorized' }),
      httpStatus: 401,
    });
  });
});
