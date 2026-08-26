import { API_ROUTES } from '../constants/paymentsApiRoutes';
import {
  fetchPaymentsTransactions,
  mapPaymentsTransactionsHttpError,
} from '../api/fetchPaymentsTransactions';

jest.mock('../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://app.example.com',
}));

jest.mock('../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

describe('fetchPaymentsTransactions', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('gets the first page without parsing the cursor', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({
        success: true,
        currency: 'usd',
        balance: {
          availableLabel: '$1,247.50',
          pendingLabel: '$320.00',
          availableCaption: 'Available',
          pendingCaption: 'On the way',
        },
        items: [
          {
            id: 'txn_1',
            tone: 'in',
            title: 'Lights',
            amountLabel: '+$38.54',
          },
        ],
        hasMore: true,
        nextCursor: 'opaque-cursor',
      }),
    });

    const result = await fetchPaymentsTransactions('token', { limit: 20 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.page.items[0].title).toBe('Lights');
    expect(result.page.nextCursor).toBe('opaque-cursor');
    expect(global.fetch).toHaveBeenCalledWith(
      `https://app.example.com${API_ROUTES.PAYMENTS_TRANSACTIONS}?limit=20`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
        }),
      }),
    );
  });

  it('passes nextCursor through as startingAfter', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ success: true, items: [], hasMore: false }),
    });

    await fetchPaymentsTransactions('token', {
      limit: 20,
      startingAfter: '2026-08-24T17:00:00.000Z|txn_1',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `https://app.example.com${API_ROUTES.PAYMENTS_TRANSACTIONS}?limit=20&startingAfter=${encodeURIComponent('2026-08-24T17:00:00.000Z|txn_1')}`,
      expect.any(Object),
    );
  });

  it('maps 403 to the Pro upgrade copy', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 403,
      headers: { get: () => null },
      json: async () => ({ success: false, error: 'Upgrade to Pro to view transactions.' }),
    });

    const result = await fetchPaymentsTransactions('token');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toBe('Upgrade to Pro to view transactions.');
  });

  it('treats a 200 empty list as no transactions, even without success', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({
        items: [],
        balance: {
          availableLabel: '$0.00',
          pendingLabel: '$0.00',
        },
      }),
    });

    const result = await fetchPaymentsTransactions('token');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.page.items).toEqual([]);
    expect(result.page.balance.availableLabel).toBe('$0.00');
  });

  it('requires a token', async () => {
    const result = await fetchPaymentsTransactions('');
    expect(result.ok).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('mapPaymentsTransactionsHttpError', () => {
  it('prefers the server message', () => {
    expect(mapPaymentsTransactionsHttpError(401, 'Sign in again to view transactions.')).toBe(
      'Sign in again to view transactions.',
    );
  });
});
