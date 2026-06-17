import { getBookingMarkCompleteSheetCopy } from '../constants/bookingCompleteCopy';

describe('getBookingMarkCompleteSheetCopy', () => {
  it('highlights review SMS when showReviewSmsMessage is true', () => {
    const copy = getBookingMarkCompleteSheetCopy({ showReviewSmsMessage: true });
    expect(copy.highlightVariant).toBe('review_sms');
    expect(copy.highlightTitle).toMatch(/text your customer/i);
    expect(copy.highlightBody).toMatch(/review/i);
    expect(copy.confirmLabel).toBe('Complete visit');
  });

  it('highlights review email when showReviewInviteMessage is true', () => {
    const copy = getBookingMarkCompleteSheetCopy({ showReviewInviteMessage: true });
    expect(copy.highlightVariant).toBe('review_email');
    expect(copy.highlightTitle).toMatch(/email your customer/i);
    expect(copy.confirmLabel).toBe('Complete visit');
  });

  it('highlights no review when showNoReviewInviteMessage is true', () => {
    const copy = getBookingMarkCompleteSheetCopy({ showNoReviewInviteMessage: true });
    expect(copy.highlightVariant).toBe('no_review');
    expect(copy.highlightTitle).toMatch(/no review request/i);
  });

  it('uses simple copy when all preview flags are false', () => {
    const copy = getBookingMarkCompleteSheetCopy({
      showReviewInviteMessage: false,
      showReviewSmsMessage: false,
      showNoReviewInviteMessage: false,
    });
    expect(copy.highlightVariant).toBeNull();
    expect(copy.body).toMatch(/appointment.*completed/i);
  });

  it('uses simple copy when modal copy is null', () => {
    const copy = getBookingMarkCompleteSheetCopy(null);
    expect(copy.highlightVariant).toBeNull();
    expect(copy.body).toMatch(/appointment.*completed/i);
  });
});
