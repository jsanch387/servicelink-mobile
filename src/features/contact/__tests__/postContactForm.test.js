jest.mock('../../../lib/webAppOrigin', () => ({
  getWebAppOrigin: jest.fn(),
}));

import { getWebAppOrigin } from '../../../lib/webAppOrigin';
import { postContactForm } from '../api/postContactForm';

describe('postContactForm', () => {
  const originalDev = global.__DEV__;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.__DEV__ = true;
    global.fetch = jest.fn();
    getWebAppOrigin.mockReturnValue('');
  });

  afterAll(() => {
    global.__DEV__ = originalDev;
    global.fetch = originalFetch;
  });

  const sampleBody = {
    name: 'Alex Rivera',
    email: 'alex@example.com',
    topic: 'bug_report',
    message: 'The bookings list does not refresh after I approve a quote.',
  };

  it('POSTs JSON to /api/contact without Authorization', async () => {
    getWebAppOrigin.mockReturnValue('http://localhost:3000');
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ success: true }),
    });

    await expect(postContactForm(sampleBody)).resolves.toEqual({ ok: true });

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...sampleBody,
        website: '',
      }),
    });
  });

  it('returns server error and code on validation failure', async () => {
    getWebAppOrigin.mockReturnValue('http://localhost:3000');
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => null },
      json: async () => ({
        success: false,
        error: 'Message is too short.',
        code: 'VALIDATION_ERROR',
      }),
    });

    await expect(postContactForm(sampleBody)).resolves.toEqual({
      ok: false,
      error: 'Message is too short.',
      code: 'VALIDATION_ERROR',
      httpStatus: 400,
    });
  });

  it('parses Retry-After on rate limit', async () => {
    getWebAppOrigin.mockReturnValue('http://localhost:3000');
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: (key) => (key === 'Retry-After' ? '120' : null) },
      json: async () => ({
        success: false,
        error: 'Too many submissions.',
        code: 'RATE_LIMITED',
      }),
    });

    await expect(postContactForm(sampleBody)).resolves.toEqual({
      ok: false,
      error: 'Too many submissions.',
      code: 'RATE_LIMITED',
      retryAfterSeconds: 120,
      httpStatus: 429,
    });
  });

  it('uses production origin when env is empty in production', async () => {
    global.__DEV__ = false;
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ success: true }),
    });

    await postContactForm(sampleBody);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://myservicelink.app/api/contact',
      expect.any(Object),
    );
  });
});
