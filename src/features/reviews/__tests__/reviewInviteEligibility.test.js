import {
  customerAlreadyReviewed,
  getCompleteVisitNotificationPreview,
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

  it('getCompleteVisitNotificationPreview includes review link for SMS when not reviewed', () => {
    expect(
      getCompleteVisitNotificationPreview(
        { ...eligibleBooking, customer_phone: '5552345678' },
        emptyCtx(),
      ),
    ).toEqual({
      showReviewSmsMessage: true,
      showReviewInviteMessage: false,
      showNoReviewInviteMessage: false,
      showReviewInvite: true,
    });
  });

  it('getCompleteVisitNotificationPreview is receipt-only SMS when customer already reviewed', () => {
    const ctx = emptyCtx();
    ctx.reviewedCustomerIds.add('cust-1');
    expect(
      getCompleteVisitNotificationPreview(
        { ...eligibleBooking, customer_phone: '5552345678' },
        ctx,
      ),
    ).toEqual({
      showReviewSmsMessage: true,
      showReviewInviteMessage: false,
      showNoReviewInviteMessage: false,
      showReviewInvite: false,
    });
  });

  it('getCompleteVisitNotificationPreview is receipt-only email when customer already reviewed', () => {
    const ctx = emptyCtx();
    ctx.reviewedCustomerIds.add('cust-1');
    expect(getCompleteVisitNotificationPreview(eligibleBooking, ctx)).toEqual({
      showReviewSmsMessage: false,
      showReviewInviteMessage: true,
      showNoReviewInviteMessage: false,
      showReviewInvite: false,
    });
  });
});
