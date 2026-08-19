import { getScheduleLinkSentToastMessage } from '../utils/scheduleLinkSentCopy';

describe('getScheduleLinkSentToastMessage', () => {
  it('covers email, text, and both', () => {
    expect(getScheduleLinkSentToastMessage({ emailed: true, smsed: true })).toBe(
      'Schedule link sent via email + text',
    );
    expect(getScheduleLinkSentToastMessage({ emailed: true, smsed: false })).toBe(
      'Schedule link sent via email',
    );
    expect(getScheduleLinkSentToastMessage({ emailed: false, smsed: true })).toBe(
      'Schedule link sent via text',
    );
  });
});
