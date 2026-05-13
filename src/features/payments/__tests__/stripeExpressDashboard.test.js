jest.mock('../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: jest.fn(() => 'https://app.example.com'),
  assertStripeCheckoutOriginAllowed: jest.fn(),
}));

import {
  assertStripeCheckoutOriginAllowed,
  resolveStripeMobileCheckoutOrigin,
} from '../../../lib/stripeMobileCheckoutOrigin';
import { fetchStripeExpressDashboardUrl } from '../api/stripeExpressDashboard';

describe('fetchStripeExpressDashboardUrl', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    resolveStripeMobileCheckoutOrigin.mockReturnValue('https://app.example.com');
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('POSTs with Bearer and client mobile, returns url on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, url: 'https://connect.stripe.com/express/acct_test' }),
    });

    const out = await fetchStripeExpressDashboardUrl('jwt-token');

    expect('url' in out && out.url).toBe('https://connect.stripe.com/express/acct_test');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/stripe/connect/express-dashboard',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ client: 'mobile' }),
      }),
    );
    expect(assertStripeCheckoutOriginAllowed).toHaveBeenCalledWith('https://app.example.com');
  });

  it('returns error when not signed in', async () => {
    global.fetch = jest.fn();
    const out = await fetchStripeExpressDashboardUrl(null);
    expect('error' in out).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
