jest.mock('../../../lib/webAppOrigin', () => ({
  getWebAppOrigin: jest.fn(),
}));

jest.mock('../utils/onboardingCompleteLog', () => ({
  onboardingCompleteLogOk: jest.fn(),
  onboardingCompleteLogError: jest.fn(),
}));

import { getWebAppOrigin } from '../../../lib/webAppOrigin';
import { completeOnboardingV2 } from '../api/completeOnboardingV2';
import {
  onboardingCompleteLogError,
  onboardingCompleteLogOk,
} from '../utils/onboardingCompleteLog';

describe('completeOnboardingV2', () => {
  const originalDev = global.__DEV__;
  const originalFetch = global.fetch;
  const originalCrypto = globalThis.crypto;

  beforeEach(() => {
    jest.clearAllMocks();
    global.__DEV__ = true;
    global.fetch = jest.fn();
    getWebAppOrigin.mockReturnValue('http://localhost:3000');
    globalThis.crypto = { randomUUID: () => '550e8400-e29b-41d4-a716-446655440000' };
  });

  afterAll(() => {
    global.__DEV__ = originalDev;
    global.fetch = originalFetch;
    globalThis.crypto = originalCrypto;
  });

  it('POSTs empty JSON with Bearer and X-Request-ID (server-owned completion)', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        request_id: '550e8400-e29b-41d4-a716-446655440000',
        welcome_email: { attempted: true, sent: true },
      }),
    });

    await expect(completeOnboardingV2('jwt-token')).resolves.toEqual({ ok: true });

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/onboarding-v2/complete', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer jwt-token',
        'Content-Type': 'application/json',
        'X-Request-ID': '550e8400-e29b-41d4-a716-446655440000',
      },
      body: JSON.stringify({}),
    });
  });

  it('sends sendWelcomeEvenIfAlreadyCompleted when requested', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        welcome_email: { attempted: false, reason: 'already_completed_no_flag' },
      }),
    });

    await completeOnboardingV2('jwt-token', { sendWelcomeEvenIfAlreadyCompleted: true });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ sendWelcomeEvenIfAlreadyCompleted: true }),
      }),
    );
  });

  it('returns error when access token is missing', async () => {
    const out = await completeOnboardingV2(null);
    expect(out).toMatchObject({
      httpStatus: 0,
      userMessage: expect.stringContaining('sign in'),
    });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(onboardingCompleteLogError).toHaveBeenCalledWith('not signed in');
  });

  it('returns userMessage on HTTP failure', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: 'Invalid or expired session',
      }),
    });

    const out = await completeOnboardingV2('jwt-token');
    expect(out).toMatchObject({
      httpStatus: 401,
      userMessage: expect.stringContaining('session expired'),
    });
    expect(onboardingCompleteLogError).toHaveBeenCalledWith(
      'complete failed (401)',
      'Invalid or expired session',
    );
  });

  it('treats success with welcome_email send failure as ok', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        welcome_email: { attempted: true, sent: false, error: 'RESEND_API_KEY is not set' },
      }),
    });

    await expect(completeOnboardingV2('jwt-token')).resolves.toEqual({ ok: true });
    expect(onboardingCompleteLogOk).toHaveBeenCalledWith(
      'welcome email not sent (RESEND_API_KEY is not set)',
    );
  });
});
