jest.mock('../../../lib/webAppOrigin', () => ({
  getWebAppOrigin: jest.fn(),
}));

import { getWebAppOrigin } from '../../../lib/webAppOrigin';
import { deleteAccountViaWeb } from '../api/deleteAccount';

describe('deleteAccountViaWeb', () => {
  const originalDev = global.__DEV__;
  const originalFetch = global.fetch;
  const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    global.__DEV__ = true;
    global.fetch = jest.fn();
    getWebAppOrigin.mockReturnValue('');
  });

  afterAll(() => {
    global.__DEV__ = originalDev;
    global.fetch = originalFetch;
    infoSpy.mockRestore();
  });

  it('sends DELETE /api/account with bearer token and confirmEmail body', async () => {
    getWebAppOrigin.mockReturnValue('http://localhost:3000');
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    await expect(
      deleteAccountViaWeb({ accessToken: 'jwt-token', confirmEmail: 'owner@example.com' }),
    ).resolves.toEqual({ success: true });

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/account', {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer jwt-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirmEmail: 'owner@example.com' }),
    });
  });

  it('uses iOS simulator localhost fallback in dev when origin is empty', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    await deleteAccountViaWeb({ accessToken: 'jwt-token', confirmEmail: 'owner@example.com' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^http:\/\/localhost:3000\/api\/account$/),
      expect.any(Object),
    );
  });

  it('uses production domain fallback when origin is empty in production', async () => {
    global.__DEV__ = false;
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    await deleteAccountViaWeb({ accessToken: 'jwt-token', confirmEmail: 'owner@example.com' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://myservicelink.app/api/account',
      expect.any(Object),
    );
  });

  it('rejects insecure production origins', async () => {
    global.__DEV__ = false;
    getWebAppOrigin.mockReturnValue('http://myservicelink.app');

    await expect(
      deleteAccountViaWeb({ accessToken: 'jwt-token', confirmEmail: 'owner@example.com' }),
    ).rejects.toThrow('Production account deletion requires an https web origin');
  });
});
