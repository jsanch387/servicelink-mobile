import {
  CANCEL_MEMBERSHIP_NOW,
  CANCEL_MEMBERSHIP_PERIOD_END,
  mapCancelMembershipHttpError,
  postCancelMembership,
} from '../api/postCancelMembership';

jest.mock('../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://app.example.com',
}));

jest.mock('../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

describe('postCancelMembership', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('POSTs cancel_at_period_end with Bearer auth', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        alreadyCanceled: false,
        subscriber: {
          id: 'sub-1',
          status: 'active',
          cancelAtPeriodEnd: true,
          nextBillingAt: null,
          visitStatus: 'none',
        },
      }),
    });

    const result = await postCancelMembership('token-1', 'sub-1', CANCEL_MEMBERSHIP_PERIOD_END);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.alreadyCanceled).toBe(false);
      expect(result.subscriber.id).toBe('sub-1');
      expect(result.subscriber.cancelAtPeriodEnd).toBe(true);
    }
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/memberships/subscribers/sub-1',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-1',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ action: 'cancel_at_period_end' }),
      }),
    );
  });

  it('POSTs cancel_now', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        alreadyCanceled: false,
        subscriber: { id: 'sub-1', status: 'canceled', cancelAtPeriodEnd: false },
      }),
    });

    const result = await postCancelMembership('token-1', 'sub-1', CANCEL_MEMBERSHIP_NOW);

    expect(result.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ action: 'cancel_now' }),
      }),
    );
  });

  it('treats idempotent alreadyCanceled as success', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        alreadyCanceled: true,
        subscriber: { id: 'sub-1', status: 'canceled' },
      }),
    });

    const result = await postCancelMembership('token-1', 'sub-1', CANCEL_MEMBERSHIP_NOW);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.alreadyCanceled).toBe(true);
  });

  it('surfaces Stripe 502 copy', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({
        success: false,
        error: 'Could not cancel this subscription in Stripe.',
      }),
    });

    const result = await postCancelMembership('token-1', 'sub-1', CANCEL_MEMBERSHIP_NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.httpStatus).toBe(502);
      expect(result.error.message).toBe('Could not cancel this subscription in Stripe.');
    }
  });

  it('rejects missing auth without fetching', async () => {
    const result = await postCancelMembership(null, 'sub-1', CANCEL_MEMBERSHIP_NOW);
    expect(result.ok).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('mapCancelMembershipHttpError', () => {
  it('prefers server 403 gate copy', () => {
    expect(mapCancelMembershipHttpError(403, null, 'not_pro')).toBe(
      'Upgrade to Pro to manage subscriptions.',
    );
  });
});
