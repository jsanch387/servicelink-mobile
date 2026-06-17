import { getMarkCompletePreviewFromBooking } from '../utils/markCompletePreview';

describe('getMarkCompletePreviewFromBooking', () => {
  it('shows SMS highlight when customer has a valid phone', () => {
    expect(getMarkCompletePreviewFromBooking({ customer_phone: '5552345678' })).toEqual({
      showReviewSmsMessage: true,
      showReviewInviteMessage: false,
      showNoReviewInviteMessage: false,
    });
  });

  it('shows email highlight when phone is missing but email is valid', () => {
    expect(
      getMarkCompletePreviewFromBooking({
        customer_phone: null,
        customer_email: 'jordan@email.com',
      }),
    ).toEqual({
      showReviewSmsMessage: false,
      showReviewInviteMessage: true,
      showNoReviewInviteMessage: false,
    });
  });

  it('shows no-review highlight when contact info is missing', () => {
    expect(
      getMarkCompletePreviewFromBooking({ customer_phone: null, customer_email: null }),
    ).toEqual({
      showReviewSmsMessage: false,
      showReviewInviteMessage: false,
      showNoReviewInviteMessage: true,
    });
  });

  it('prefers SMS over email when both are present', () => {
    expect(
      getMarkCompletePreviewFromBooking({
        customer_phone: '5552345678',
        customer_email: 'jordan@email.com',
      }),
    ).toEqual({
      showReviewSmsMessage: true,
      showReviewInviteMessage: false,
      showNoReviewInviteMessage: false,
    });
  });
});
