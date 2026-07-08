jest.mock('../constants/markCompleteFeatureFlags', () => ({
  COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY: true,
}));

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

  it('getCompleteVisitSuccessDetail uses receipt-only copy when review invite is skipped', () => {
    expect(getCompleteVisitSuccessDetail({ showReviewSms: true, showReviewInvite: false })).toBe(
      'We texted your customer their receipt.',
    );
    expect(getCompleteVisitSuccessDetail({ showReviewEmail: true, showReviewInvite: false })).toBe(
      'We emailed your customer their receipt.',
    );
  });

  it('getCompleteVisitFollowUpMessage uses receipt-only copy when review invite is skipped', () => {
    expect(
      getCompleteVisitFollowUpMessage({ showReviewSms: true, showReviewInvite: false }).message,
    ).toBe("We'll text your customer their receipt.");
    expect(
      getCompleteVisitFollowUpMessage({ showReviewEmail: true, showReviewInvite: false }).message,
    ).toBe("We'll email your customer their receipt.");
  });

  it('getCompleteVisitFollowUpMessage warns when no contact channels', () => {
    expect(
      getCompleteVisitFollowUpMessage({ showReviewSms: false, showReviewEmail: false }),
    ).toEqual({
      visible: true,
      message: "No phone or email on this booking — your customer won't be notified automatically.",
      iconName: 'information-circle-outline',
    });
  });

  it('getCompleteVisitSuccessDetail falls back when no contact', () => {
    expect(getCompleteVisitSuccessDetail({ showReviewSms: false, showReviewEmail: false })).toBe(
      'This service is marked complete on your calendar.',
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

  it('getCompleteVisitPaymentSettledBanner covers prepaid online bookings', () => {
    expect(
      getCompleteVisitPaymentSettledBanner({
        paidOnline: 145,
        subtotal: 145,
        tapToPayAmount: 0,
        inPersonPayment: null,
      }),
    ).toEqual({
      title: 'Paid in full',
      detail: 'Paid online before this service.',
    });
  });
});

describe('completeVisitNotificationCopy (ship mode — notification copy hidden)', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../constants/markCompleteFeatureFlags', () => ({
      COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY: false,
    }));
  });

  it('hides follow-up row and uses neutral success detail', () => {
    const {
      getCompleteVisitFollowUpMessage: followUp,
      getCompleteVisitSuccessDetail: successDetail,
    } = require('../constants/completeVisitNotificationCopy');

    expect(followUp({ showReviewSms: true, showReviewEmail: true })).toEqual({
      visible: false,
      message: '',
      iconName: 'information-circle-outline',
    });
    expect(successDetail({ showReviewSms: true })).toBe(
      'This service is marked complete on your calendar.',
    );
  });
});
