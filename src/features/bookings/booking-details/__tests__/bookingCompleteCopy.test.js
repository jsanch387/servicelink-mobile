jest.mock('../constants/markCompleteFeatureFlags', () => ({
  COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY: true,
}));

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

describe('getBookingMarkCompleteSheetCopy (ship mode — notification copy hidden)', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../constants/markCompleteFeatureFlags', () => ({
      COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY: false,
    }));
  });

  it('never shows SMS/email highlight when flag is off', () => {
    const {
      getBookingMarkCompleteSheetCopy: getCopy,
    } = require('../constants/bookingCompleteCopy');
    const copy = getCopy({ showReviewSmsMessage: true });
    expect(copy.highlightVariant).toBeNull();
    expect(copy.body).toMatch(/appointment.*completed/i);
    expect(copy.highlightTitle).toBeUndefined();
  });
});
