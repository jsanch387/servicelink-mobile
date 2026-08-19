import { getMarkCompletePreviewFromBooking } from '../utils/markCompletePreview';

const CAN_TEXT = { canUseSms: true };

describe('getMarkCompletePreviewFromBooking', () => {
  it('shows SMS highlight when customer has a valid phone', () => {
    expect(getMarkCompletePreviewFromBooking({ customer_phone: '5552345678' }, CAN_TEXT)).toEqual({
      showReviewSmsMessage: true,
      showReviewInviteMessage: false,
      showNoReviewInviteMessage: false,
      showSmsOptOutMessage: false,
      showReviewInvite: true,
    });
  });

  it('shows email highlight when phone is missing but email is valid', () => {
    expect(
      getMarkCompletePreviewFromBooking(
        {
          customer_phone: null,
          customer_email: 'jordan@email.com',
        },
        CAN_TEXT,
      ),
    ).toEqual({
      showReviewSmsMessage: false,
      showReviewInviteMessage: true,
      showNoReviewInviteMessage: false,
      showSmsOptOutMessage: false,
      showReviewInvite: true,
    });
  });

  it('shows no-review highlight when contact info is missing', () => {
    expect(
      getMarkCompletePreviewFromBooking({ customer_phone: null, customer_email: null }, CAN_TEXT),
    ).toEqual({
      showReviewSmsMessage: false,
      showReviewInviteMessage: false,
      showNoReviewInviteMessage: true,
      showSmsOptOutMessage: false,
      showReviewInvite: false,
    });
  });

  it('prefers SMS over email when both are present', () => {
    expect(
      getMarkCompletePreviewFromBooking(
        {
          customer_phone: '5552345678',
          customer_email: 'jordan@email.com',
        },
        CAN_TEXT,
      ),
    ).toEqual({
      showReviewSmsMessage: true,
      showReviewInviteMessage: false,
      showNoReviewInviteMessage: false,
      showSmsOptOutMessage: false,
      showReviewInvite: true,
    });
  });

  it('falls back to email when the owner cannot text, even with a phone on file', () => {
    expect(
      getMarkCompletePreviewFromBooking({
        customer_phone: '5552345678',
        customer_email: 'jordan@email.com',
      }),
    ).toEqual({
      showReviewSmsMessage: false,
      showReviewInviteMessage: true,
      showNoReviewInviteMessage: false,
      showSmsOptOutMessage: false,
      showReviewInvite: true,
    });
  });

  it('warns nothing will go out when the owner cannot text and there is no email', () => {
    expect(getMarkCompletePreviewFromBooking({ customer_phone: '5552345678' })).toEqual({
      showReviewSmsMessage: false,
      showReviewInviteMessage: false,
      showNoReviewInviteMessage: true,
      showSmsOptOutMessage: false,
      showReviewInvite: false,
    });
  });

  it('explains SMS opt-out when a phone is on file but texts are not allowed', () => {
    expect(
      getMarkCompletePreviewFromBooking(
        { customer_phone: '5552345678', customer_email: null },
        { canUseSms: true, smsOptIn: false },
      ),
    ).toEqual({
      showReviewSmsMessage: false,
      showReviewInviteMessage: false,
      showNoReviewInviteMessage: false,
      showSmsOptOutMessage: true,
      showReviewInvite: false,
    });
  });
});
