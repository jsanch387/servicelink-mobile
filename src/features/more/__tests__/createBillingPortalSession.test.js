jest.mock('../../../lib/webAppOrigin', () => ({
  getWebAppOrigin: jest.fn(),
}));

import { getWebAppOrigin } from '../../../lib/webAppOrigin';
import { createBillingPortalSession } from '../api/createBillingPortalSession';

describe('createBillingPortalSession', () => {
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

  it('POSTs portal contract body with Bearer token', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        url: 'https://billing.stripe.com/p/session/test_abc',
      }),
    });

    await expect(createBillingPortalSession('jwt-token')).resolves.toEqual({
      url: 'https://billing.stripe.com/p/session/test_abc',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/stripe/create-portal-session',
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
    const out = await createBillingPortalSession(null);
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
      json: async () => ({ success: true, url: 'https://billing.stripe.com/p/session/test_prod' }),
    });

    await createBillingPortalSession('jwt-token');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://myservicelink.app/api/stripe/create-portal-session',
      expect.any(Object),
    );
  });

  it('rejects insecure production origins', async () => {
    global.__DEV__ = false;
    getWebAppOrigin.mockReturnValue('http://localhost:3000');
    const out = await createBillingPortalSession('jwt-token');
    expect(out).toEqual({
      error: expect.objectContaining({
        message: 'Production billing portal requires an https web origin',
      }),
      httpStatus: 0,
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
