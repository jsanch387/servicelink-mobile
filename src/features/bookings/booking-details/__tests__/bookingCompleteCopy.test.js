import { getBookingMarkCompleteSheetCopy } from '../constants/bookingCompleteCopy';

describe('getBookingMarkCompleteSheetCopy', () => {
  it('highlights review email when showReviewInviteMessage is true', () => {
    const copy = getBookingMarkCompleteSheetCopy({ showReviewInviteMessage: true });
    expect(copy.highlightVariant).toBe('review_email');
    expect(copy.highlightTitle).toMatch(/send a review request/i);
    expect(copy.confirmLabel).toBe('Complete');
  });

  it('uses simple copy when showReviewInviteMessage is false', () => {
    const copy = getBookingMarkCompleteSheetCopy({ showReviewInviteMessage: false });
    expect(copy.highlightVariant).toBeNull();
    expect(copy.body).toMatch(/appointment.*completed/i);
  });

  it('uses simple copy when modal copy is null', () => {
    const copy = getBookingMarkCompleteSheetCopy(null);
    expect(copy.highlightVariant).toBeNull();
    expect(copy.body).toMatch(/appointment.*completed/i);
  });
});
