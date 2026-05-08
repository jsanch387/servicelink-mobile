jest.mock('../../../lib/webAppOrigin', () => ({
  getWebAppOrigin: jest.fn(),
}));

import { getWebAppOrigin } from '../../../lib/webAppOrigin';
import { createPaywallUpgradeCheckoutSession } from '../api/createPaywallUpgradeCheckoutSession';

describe('createPaywallUpgradeCheckoutSession', () => {
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

  it('POSTs paywall contract body with Bearer token', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        url: 'https://checkout.stripe.com/c/pay/cs_test_upgrade',
      }),
    });

    await expect(createPaywallUpgradeCheckoutSession('jwt-token')).resolves.toEqual({
      url: 'https://checkout.stripe.com/c/pay/cs_test_upgrade',
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
        body: JSON.stringify({ client: 'mobile' }),
      },
    );
  });

  it('returns error when access token is missing', async () => {
    const out = await createPaywallUpgradeCheckoutSession(null);
    expect(out).toEqual({
      error: expect.objectContaining({ message: expect.stringContaining('Not signed in') }),
      httpStatus: 0,
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('uses production domain fallback when origin is empty in production', async () => {
    global.__DEV__ = false;
    getWebAppOrigin.mockReturnValue('');
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, url: 'https://checkout.stripe.com/c/pay/cs_test_prod' }),
    });

    await createPaywallUpgradeCheckoutSession('jwt-token');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://myservicelink.app/api/stripe/create-checkout-session',
      expect.objectContaining({
        body: JSON.stringify({ client: 'mobile' }),
      }),
    );
  });

  it('rejects insecure production origins', async () => {
    global.__DEV__ = false;
    getWebAppOrigin.mockReturnValue('http://localhost:3000');

    const out = await createPaywallUpgradeCheckoutSession('jwt-token');
    expect(out).toEqual({
      error: expect.objectContaining({
        message: 'Production checkout requires an https web origin',
      }),
      httpStatus: 0,
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns error on 401 with server message', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ success: false, error: 'Unauthorized' }),
    });

    const out = await createPaywallUpgradeCheckoutSession('bad-token');
    expect(out).toEqual({
      error: expect.objectContaining({ message: 'Unauthorized' }),
      httpStatus: 401,
    });
  });
});
