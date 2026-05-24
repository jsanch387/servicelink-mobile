import {
  getAuthErrorMessage,
  getAuthErrorHint,
  getLoginCodeSentMessage,
} from '../utils/authErrors';
import {
  NO_EXISTING_SERVICELINK_ACCOUNT_CODE,
  NO_EXISTING_SERVICELINK_ACCOUNT_HINT,
  NO_EXISTING_SERVICELINK_ACCOUNT_TITLE,
} from '../constants/existingAccountOnlyCopy';

describe('getAuthErrorMessage', () => {
  it('returns the existing-account title for typed errors', () => {
    const error = new Error(NO_EXISTING_SERVICELINK_ACCOUNT_TITLE);
    error.code = NO_EXISTING_SERVICELINK_ACCOUNT_CODE;

    expect(getAuthErrorMessage(error)).toBe(NO_EXISTING_SERVICELINK_ACCOUNT_TITLE);
  });

  it('maps Supabase otp_disabled to the existing-account title', () => {
    const error = new Error('Signups not allowed for otp');
    error.code = 'otp_disabled';

    expect(getAuthErrorMessage(error)).toBe(NO_EXISTING_SERVICELINK_ACCOUNT_TITLE);
    expect(getAuthErrorHint(error)).toBe(NO_EXISTING_SERVICELINK_ACCOUNT_HINT);
  });

  it('maps expired OTP errors', () => {
    expect(getAuthErrorMessage(new Error('Token has expired or is invalid'))).toBe(
      'That code expired. Request a new one.',
    );
  });
});

describe('getLoginCodeSentMessage', () => {
  it('returns a neutral sent message', () => {
    expect(getLoginCodeSentMessage()).toMatch(/sent a login code/i);
  });
});
