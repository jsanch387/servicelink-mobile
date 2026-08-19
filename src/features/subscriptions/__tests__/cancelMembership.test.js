import { applyOwnerSubscriberPayload } from '../utils/applyOwnerSubscriberPayload';
import { getCancelMembershipToastMessage } from '../utils/cancelMembershipCopy';

describe('getCancelMembershipToastMessage', () => {
  it('covers new cancel, immediate, and already canceled', () => {
    expect(getCancelMembershipToastMessage({ action: 'cancel_at_period_end' })).toBe(
      'Cancels at period end',
    );
    expect(getCancelMembershipToastMessage({ action: 'cancel_now' })).toBe('Subscription canceled');
    expect(getCancelMembershipToastMessage({ alreadyCanceled: true, action: 'cancel_now' })).toBe(
      'Subscription already canceled — status updated',
    );
  });
});

describe('applyOwnerSubscriberPayload', () => {
  const base = {
    id: 'sub-1',
    status: 'active',
    cancelScheduled: false,
    cancelAtPeriodEnd: false,
    planRemoved: false,
    visitStatus: 'needs_visit',
    nextBillingAt: '2026-09-01',
    currentPeriodEnd: '2026-09-01',
    isActiveList: true,
    isCanceledList: false,
  };

  it('applies period-end cancel onto the catalog row', () => {
    const next = applyOwnerSubscriberPayload(base, {
      id: 'sub-1',
      status: 'active',
      cancelAtPeriodEnd: true,
      nextBillingAt: null,
      visitStatus: 'none',
    });
    expect(next.cancelScheduled).toBe(true);
    expect(next.cancelAtPeriodEnd).toBe(true);
    expect(next.nextBillingAt).toBe(null);
    expect(next.visitStatus).toBe('none');
    expect(next.isActiveList).toBe(false);
    expect(next.isCanceledList).toBe(true);
    expect(next.pillLabel).toBe('Canceled');
  });

  it('applies cancel now as canceled with no access banner flags', () => {
    const next = applyOwnerSubscriberPayload(base, {
      id: 'sub-1',
      status: 'canceled',
      cancelAtPeriodEnd: false,
      visitStatus: 'none',
    });
    expect(next.status).toBe('canceled');
    expect(next.cancelScheduled).toBe(false);
    expect(next.isActiveList).toBe(false);
  });
});
