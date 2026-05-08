jest.mock('../../../lib/webAppOrigin', () => ({
  getWebAppOrigin: jest.fn(),
}));

import { getWebAppOrigin } from '../../../lib/webAppOrigin';
import { postStripeConnectOnboard } from '../api/postStripeConnectOnboard';

describe('postStripeConnectOnboard', () => {
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

  it('POSTs { client: mobile } with Bearer token', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        url: 'https://connect.stripe.com/setup/s/acct_test',
      }),
    });

    await expect(postStripeConnectOnboard('jwt')).resolves.toEqual({
      url: 'https://connect.stripe.com/setup/s/acct_test',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/stripe/connect/onboard',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ client: 'mobile' }),
      }),
    );
  });
});
