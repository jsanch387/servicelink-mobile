import {
  mapSendScheduleLinkHttpError,
  postSendMembershipScheduleLink,
} from '../api/postSendMembershipScheduleLink';

jest.mock('../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://app.example.com',
}));

jest.mock('../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

describe('postSendMembershipScheduleLink', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('POSTs send_schedule_link with Bearer auth', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({
        success: true,
        emailed: true,
        smsed: false,
        scheduleUrl: 'https://app.example.com/shop/membership/visit?token=abc',
      }),
    });

    const result = await postSendMembershipScheduleLink('token-1', 'sub-1');

    expect(result).toEqual({
      ok: true,
      emailed: true,
      smsed: false,
      scheduleUrl: 'https://app.example.com/shop/membership/visit?token=abc',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/memberships/subscribers/sub-1',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-1',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ action: 'send_schedule_link' }),
      }),
    );
  });

  it('returns server error and Retry-After on 429', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      headers: {
        get: (name) => (String(name).toLowerCase() === 'retry-after' ? '120' : null),
      },
      json: async () => ({
        success: false,
        error: 'Already sent. Try again in a few minutes.',
      }),
    });

    const result = await postSendMembershipScheduleLink('token-1', 'sub-1');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('Already sent. Try again in a few minutes.');
      expect(result.httpStatus).toBe(429);
      expect(result.retryAfterSec).toBe(120);
    }
  });

  it('rejects missing auth', async () => {
    const result = await postSendMembershipScheduleLink(null, 'sub-1');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/signed in/i);
    }
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('mapSendScheduleLinkHttpError', () => {
  it('prefers server 409 copy', () => {
    expect(mapSendScheduleLinkHttpError(409, 'Visit already scheduled', null)).toBe(
      'Visit already scheduled',
    );
  });
});
