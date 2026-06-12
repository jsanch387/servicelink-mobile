import { parseBookingSmsOutcome } from '../utils/parseBookingSmsOutcome';

describe('parseBookingSmsOutcome', () => {
  it('reads sms from the response root', () => {
    expect(
      parseBookingSmsOutcome({
        success: true,
        data: { id: 'b1' },
        sms: { sent: true, messageId: 'm1' },
      }),
    ).toEqual({ sent: true, reason: null, messageId: 'm1' });
  });

  it('reads sms nested under data', () => {
    expect(
      parseBookingSmsOutcome({
        success: true,
        data: { id: 'b1', sms: { sent: true, message_id: 'm2' } },
      }),
    ).toEqual({ sent: true, reason: null, messageId: 'm2' });
  });

  it('returns null when sms is absent', () => {
    expect(parseBookingSmsOutcome({ success: true, data: { id: 'b1' } })).toBeNull();
  });
});
