import {
  clampPaymentsTransactionsLimit,
  parsePaymentsTransactionItem,
  parsePaymentsTransactionsPage,
} from '../utils/parsePaymentsTransactions';

describe('parsePaymentsTransactionsPage', () => {
  it('paints server labels and drops rows without an id', () => {
    const page = parsePaymentsTransactionsPage({
      success: true,
      currency: 'usd',
      balance: {
        availableCents: 124750,
        pendingCents: 32000,
        availableLabel: '$1,247.50',
        pendingLabel: '$320.00',
        availableCaption: 'Available',
        pendingCaption: 'On the way',
      },
      items: [
        {
          id: 'txn_1',
          kind: 'payment',
          tone: 'in',
          title: 'Lights',
          subtitle: 'Jordan Lee · Tap to pay',
          amountLabel: '+$38.54',
          statusLabel: 'Paid',
          dateLabel: 'Aug 24',
          feeLabel: 'Fee $1.46',
          source: 'tap_to_pay',
        },
        { title: 'Missing id' },
      ],
      hasMore: true,
      nextCursor: '2026-08-24T17:00:00.000Z|txn_1',
    });

    expect(page.balance.availableLabel).toBe('$1,247.50');
    expect(page.balance.pendingCaption).toBe('On the way');
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      id: 'txn_1',
      title: 'Lights',
      amountLabel: '+$38.54',
      feeLabel: 'Fee $1.46',
      tone: 'in',
      extraCount: 0,
    });
    expect(page.nextCursor).toBe('2026-08-24T17:00:00.000Z|txn_1');
  });

  it('defaults empty balance labels', () => {
    const page = parsePaymentsTransactionsPage({ success: true, items: [] });
    expect(page.balance.availableLabel).toBe('$0.00');
    expect(page.balance.pendingLabel).toBe('$0.00');
    expect(page.items).toEqual([]);
    expect(page.hasMore).toBe(false);
    expect(page.nextCursor).toBeNull();
  });
});

describe('parsePaymentsTransactionItem', () => {
  it('keeps payout and out tones', () => {
    expect(parsePaymentsTransactionItem({ id: 'p1', tone: 'payout' })?.tone).toBe('payout');
    expect(parsePaymentsTransactionItem({ id: 'r1', tone: 'out' })?.tone).toBe('out');
  });

  it('reads extraCount from jobCount when needed', () => {
    expect(parsePaymentsTransactionItem({ id: 'm1', jobCount: 3 })?.extraCount).toBe(2);
  });

  it('keeps booking id, service name, extraCount, and jobCount', () => {
    expect(
      parsePaymentsTransactionItem({
        id: 'm2',
        bookingId: 'bk-1',
        serviceName: 'Signature Shine',
        extraCount: 1,
        jobCount: 2,
      }),
    ).toMatchObject({
      bookingId: 'bk-1',
      serviceName: 'Signature Shine',
      extraCount: 1,
      jobCount: 2,
    });
  });
});

describe('clampPaymentsTransactionsLimit', () => {
  it('stays between 1 and 50', () => {
    expect(clampPaymentsTransactionsLimit(0)).toBe(1);
    expect(clampPaymentsTransactionsLimit(80)).toBe(50);
    expect(clampPaymentsTransactionsLimit('20')).toBe(20);
  });
});
