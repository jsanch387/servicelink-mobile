import { parseBookingEmailOutcome } from '../utils/parseBookingEmailOutcome';

describe('parseBookingEmailOutcome', () => {
  it('reads email sent at the root', () => {
    expect(
      parseBookingEmailOutcome({
        success: true,
        email: { sent: true, messageId: 're_123', reason: null },
      }),
    ).toEqual({
      sent: true,
      messageId: 're_123',
      reason: null,
    });
  });

  it('reads snake_case message_id under data', () => {
    expect(
      parseBookingEmailOutcome({
        success: true,
        data: { email: { sent: false, message_id: null, reason: 'no_email' } },
      }),
    ).toEqual({
      sent: false,
      messageId: null,
      reason: 'no_email',
    });
  });

  it('returns null when email metadata is missing', () => {
    expect(parseBookingEmailOutcome({ success: true, jobStatus: 'completed' })).toBeNull();
  });
});
