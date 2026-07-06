import { resolveToastAutoDismissMs, TOAST_AUTO_DISMISS_MS } from '../toastAutoDismiss';

describe('resolveToastAutoDismissMs', () => {
  it('uses readable defaults for standard toasts', () => {
    expect(resolveToastAutoDismissMs('success', 'default', undefined)).toBe(
      TOAST_AUTO_DISMISS_MS.success,
    );
    expect(resolveToastAutoDismissMs('error', 'default', undefined)).toBe(
      TOAST_AUTO_DISMISS_MS.error,
    );
    expect(resolveToastAutoDismissMs('info', 'default', undefined)).toBe(
      TOAST_AUTO_DISMISS_MS.info,
    );
  });

  it('auto-dismisses sms and email confirmation cards', () => {
    expect(resolveToastAutoDismissMs('success', 'sms', undefined)).toBe(
      TOAST_AUTO_DISMISS_MS.confirmation,
    );
    expect(resolveToastAutoDismissMs('info', 'email', undefined)).toBe(
      TOAST_AUTO_DISMISS_MS.confirmation,
    );
  });

  it('keeps loading toasts until updated', () => {
    expect(resolveToastAutoDismissMs('loading', 'default', undefined)).toBeNull();
  });

  it('honors explicit duration overrides', () => {
    expect(resolveToastAutoDismissMs('success', 'sms', 12000)).toBe(12000);
    expect(resolveToastAutoDismissMs('loading', 'default', null)).toBeNull();
  });
});
