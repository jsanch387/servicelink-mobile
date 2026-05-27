describe('appReviewLogin', () => {
  const originalEmail = process.env.EXPO_PUBLIC_APP_REVIEW_LOGIN_EMAIL;

  afterEach(() => {
    if (originalEmail === undefined) {
      delete process.env.EXPO_PUBLIC_APP_REVIEW_LOGIN_EMAIL;
    } else {
      process.env.EXPO_PUBLIC_APP_REVIEW_LOGIN_EMAIL = originalEmail;
    }
    jest.resetModules();
  });

  function load() {
    return require('../utils/appReviewLogin');
  }

  it('is disabled when env is unset', () => {
    delete process.env.EXPO_PUBLIC_APP_REVIEW_LOGIN_EMAIL;
    const { isAppReviewLoginEnabled, isAppReviewLoginEmail } = load();
    expect(isAppReviewLoginEnabled()).toBe(false);
    expect(isAppReviewLoginEmail('review@example.com')).toBe(false);
  });

  it('matches allowlisted email case-insensitively', () => {
    process.env.EXPO_PUBLIC_APP_REVIEW_LOGIN_EMAIL = '  Review@Example.COM ';
    const { isAppReviewLoginEnabled, isAppReviewLoginEmail } = load();
    expect(isAppReviewLoginEnabled()).toBe(true);
    expect(isAppReviewLoginEmail('review@example.com')).toBe(true);
    expect(isAppReviewLoginEmail('other@example.com')).toBe(false);
  });
});
