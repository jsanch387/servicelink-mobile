jest.mock('../../../lib/webAppOrigin', () => ({
  getWebAppOrigin: jest.fn(),
}));

import { getWebAppOrigin } from '../../../lib/webAppOrigin';
import { confirmOnboardingTrial } from '../api/confirmOnboardingTrial';

describe('confirmOnboardingTrial', () => {
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

  it('POSTs checkout_session_id when provided', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        synced_from_checkout: true,
        trial_confirmation: { onboarding_status: 'completed' },
      }),
    });

    await expect(
      confirmOnboardingTrial('jwt-token', { checkout_session_id: 'cs_test_abc' }),
    ).resolves.toEqual({
      ok: true,
      trial_confirmation: { onboarding_status: 'completed' },
      synced_from_checkout: true,
      checkout_pending: false,
      checkout_session_status: null,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/stripe/confirm-onboarding-trial',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ checkout_session_id: 'cs_test_abc' }),
      }),
    );
  });

  it('POSTs empty object for profile poll', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        synced_from_checkout: false,
        trial_confirmation: { onboarding_status: 'completed' },
      }),
    });

    await confirmOnboardingTrial('jwt-token', {});

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({}),
      }),
    );
  });
});
