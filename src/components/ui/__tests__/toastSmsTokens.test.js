import {
  resolveToastEmailTokens,
  resolveToastSmsTokens,
  TOAST_EMAIL_TOKENS,
  TOAST_SMS_TOKENS,
} from '../toastSmsTokens';

describe('resolveToastSmsTokens', () => {
  it('uses black text and a message bubble icon for success SMS', () => {
    expect(resolveToastSmsTokens('success')).toEqual(TOAST_SMS_TOKENS.success);
    expect(TOAST_SMS_TOKENS.success.icon).toBe('chatbubble-ellipses');
    expect(TOAST_SMS_TOKENS.success.text).toBe('#171717');
  });

  it('uses near-black for informational SMS', () => {
    expect(resolveToastSmsTokens('info')).toEqual(TOAST_SMS_TOKENS.info);
  });

  it('uses red for error SMS', () => {
    expect(resolveToastSmsTokens('error')).toEqual(TOAST_SMS_TOKENS.error);
  });

  it('uses black text and an envelope icon for email confirmation', () => {
    expect(resolveToastEmailTokens('success')).toEqual(TOAST_EMAIL_TOKENS.success);
    expect(TOAST_EMAIL_TOKENS.success.icon).toBe('mail-outline');
  });
});
