jest.mock('../../../lib/webAppOrigin', () => ({
  getWebAppOrigin: jest.fn(),
}));

import { getWebAppOrigin } from '../../../lib/webAppOrigin';
import { startOnboardingTrial } from '../api/startOnboardingTrial';

describe('startOnboardingTrial', () => {
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

  it('POSTs empty JSON body with Bearer token', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        trial_confirmation: { onboarding_status: 'completed', user_id: 'u1' },
      }),
    });

    await expect(startOnboardingTrial('jwt-token')).resolves.toEqual({
      ok: true,
      trial_confirmation: { onboarding_status: 'completed', user_id: 'u1' },
      alreadyActive: false,
      fallbackToCheckout: false,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/stripe/start-onboarding-trial',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer jwt-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      },
    );
  });

  it('parses fallbackToCheckout and alreadyActive', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        fallbackToCheckout: true,
        alreadyActive: true,
        trial_confirmation: null,
      }),
    });

    const out = await startOnboardingTrial('jwt-token');
    expect(out).toEqual({
      ok: true,
      trial_confirmation: null,
      alreadyActive: true,
      fallbackToCheckout: true,
    });
  });

  it('returns error when access token is missing', async () => {
    const out = await startOnboardingTrial(null);
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
      json: async () => ({ success: true }),
    });

    await startOnboardingTrial('jwt-token');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://myservicelink.app/api/stripe/start-onboarding-trial',
      expect.any(Object),
    );
  });
});
