import {
  customerAlreadyReviewed,
  getMarkCompleteModalCopy,
  willSendReviewInviteOnComplete,
} from '../utils/reviewInviteEligibility';

function emptyCtx() {
  return {
    reviewedCustomerIds: new Set(),
    pendingInviteCustomerIds: new Set(),
    bookingIdsWithInvite: new Set(),
  };
}

describe('reviewInviteEligibility', () => {
  const eligibleBooking = {
    id: 'book-1',
    customer_id: 'cust-1',
    customer_email: 'pat@example.com',
  };

  it('willSendReviewInviteOnComplete is true when all checks pass', () => {
    expect(willSendReviewInviteOnComplete(eligibleBooking, emptyCtx())).toBe(true);
  });

  it('willSendReviewInviteOnComplete is false without valid email', () => {
    expect(
      willSendReviewInviteOnComplete(
        { ...eligibleBooking, customer_email: 'not-an-email' },
        emptyCtx(),
      ),
    ).toBe(false);
  });

  it('willSendReviewInviteOnComplete is false without customer_id', () => {
    expect(
      willSendReviewInviteOnComplete({ ...eligibleBooking, customer_id: null }, emptyCtx()),
    ).toBe(false);
  });

  it('willSendReviewInviteOnComplete is false when customer already reviewed', () => {
    const ctx = emptyCtx();
    ctx.reviewedCustomerIds.add('cust-1');
    expect(willSendReviewInviteOnComplete(eligibleBooking, ctx)).toBe(false);
  });

  it('customerAlreadyReviewed reflects reviewedCustomerIds', () => {
    const ctx = emptyCtx();
    ctx.reviewedCustomerIds.add('cust-1');
    expect(customerAlreadyReviewed(eligibleBooking, ctx)).toBe(true);
  });

  it('getMarkCompleteModalCopy shows review message when has email and not reviewed', () => {
    expect(getMarkCompleteModalCopy(eligibleBooking, emptyCtx())).toEqual({
      showReviewInviteMessage: true,
    });
  });

  it('getMarkCompleteModalCopy is simple when customer already reviewed', () => {
    const ctx = emptyCtx();
    ctx.reviewedCustomerIds.add('cust-1');
    expect(getMarkCompleteModalCopy(eligibleBooking, ctx)).toEqual({
      showReviewInviteMessage: false,
    });
  });

  it('getMarkCompleteModalCopy is simple when no email', () => {
    expect(
      getMarkCompleteModalCopy({ ...eligibleBooking, customer_email: null }, emptyCtx()),
    ).toEqual({
      showReviewInviteMessage: false,
    });
  });
});
