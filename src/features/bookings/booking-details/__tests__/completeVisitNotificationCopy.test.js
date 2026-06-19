import {
  getCompleteVisitFollowUpMessage,
  getCompleteVisitPaymentSettledBanner,
  getCompleteVisitSuccessDetail,
} from '../constants/completeVisitNotificationCopy';

describe('completeVisitNotificationCopy', () => {
  it('getCompleteVisitFollowUpMessage prefers SMS wording', () => {
    expect(getCompleteVisitFollowUpMessage({ showReviewSms: true, showReviewEmail: true })).toEqual(
      {
        visible: true,
        message: "We'll text your customer a receipt and a link to leave a review.",
        iconName: 'chatbubble-ellipses-outline',
      },
    );
  });

  it('getCompleteVisitFollowUpMessage uses email when no SMS', () => {
    expect(
      getCompleteVisitFollowUpMessage({ showReviewSms: false, showReviewEmail: true }).message,
    ).toBe("We'll email your customer a receipt and a link to leave a review.");
  });

  it('getCompleteVisitSuccessDetail never includes contact info', () => {
    expect(getCompleteVisitSuccessDetail({ showReviewEmail: true })).toBe(
      'We emailed your customer their receipt and a review link.',
    );
    expect(getCompleteVisitSuccessDetail({ showReviewSms: true })).toBe(
      'We texted your customer their receipt and a review link.',
    );
  });

  it('getCompleteVisitPaymentSettledBanner covers deposit + in-person', () => {
    expect(
      getCompleteVisitPaymentSettledBanner({
        paidOnline: 50,
        subtotal: 145,
        tapToPayAmount: 0,
        inPersonPayment: { method: 'cash', amount: 95 },
      }),
    ).toEqual({
      title: 'Paid in full',
      detail: 'Balance collected for this service.',
    });
  });
});
