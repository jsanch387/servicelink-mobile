jest.mock('../api/auth', () => ({
  signInWithEmailPassword: jest.fn(),
}));

const { signInWithEmailPassword } = require('../api/auth');
const { getE2eLoginEmail, isE2eDevLoginEnabled, tryE2eDevLogin } = require('../utils/e2eDevLogin');

describe('e2eDevLogin', () => {
  const originalFlag = process.env.EXPO_PUBLIC_E2E_LOGIN;
  const originalEmail = process.env.EXPO_PUBLIC_E2E_LOGIN_EMAIL;
  const originalPassword = process.env.EXPO_PUBLIC_E2E_LOGIN_PASSWORD;

  afterEach(() => {
    restoreEnv('EXPO_PUBLIC_E2E_LOGIN', originalFlag);
    restoreEnv('EXPO_PUBLIC_E2E_LOGIN_EMAIL', originalEmail);
    restoreEnv('EXPO_PUBLIC_E2E_LOGIN_PASSWORD', originalPassword);
    jest.clearAllMocks();
  });

  function restoreEnv(key, value) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  it('is disabled when flag is unset', () => {
    delete process.env.EXPO_PUBLIC_E2E_LOGIN;
    process.env.EXPO_PUBLIC_E2E_LOGIN_EMAIL = 'e2e@example.com';
    process.env.EXPO_PUBLIC_E2E_LOGIN_PASSWORD = 'secret';
    expect(isE2eDevLoginEnabled()).toBe(false);
  });

  it('is disabled when credentials are missing', () => {
    process.env.EXPO_PUBLIC_E2E_LOGIN = 'true';
    delete process.env.EXPO_PUBLIC_E2E_LOGIN_EMAIL;
    delete process.env.EXPO_PUBLIC_E2E_LOGIN_PASSWORD;
    expect(isE2eDevLoginEnabled()).toBe(false);
  });

  it('is enabled when flag and credentials are set in __DEV__', () => {
    process.env.EXPO_PUBLIC_E2E_LOGIN = 'true';
    process.env.EXPO_PUBLIC_E2E_LOGIN_EMAIL = '  E2E@Example.COM ';
    process.env.EXPO_PUBLIC_E2E_LOGIN_PASSWORD = 'secret';
    expect(isE2eDevLoginEnabled()).toBe(true);
    expect(getE2eLoginEmail()).toBe('e2e@example.com');
  });

  it('tryE2eDevLogin is a no-op when disabled', async () => {
    delete process.env.EXPO_PUBLIC_E2E_LOGIN;
    const result = await tryE2eDevLogin();
    expect(result).toEqual({ attempted: false, session: null, error: null });
    expect(signInWithEmailPassword).not.toHaveBeenCalled();
  });

  it('tryE2eDevLogin signs in when enabled', async () => {
    process.env.EXPO_PUBLIC_E2E_LOGIN = 'true';
    process.env.EXPO_PUBLIC_E2E_LOGIN_EMAIL = 'e2e@example.com';
    process.env.EXPO_PUBLIC_E2E_LOGIN_PASSWORD = 'secret';
    const session = { user: { id: 'u1' } };
    signInWithEmailPassword.mockResolvedValue({ data: { session }, error: null });
    const result = await tryE2eDevLogin();
    expect(signInWithEmailPassword).toHaveBeenCalledWith('e2e@example.com', 'secret');
    expect(result).toEqual({ attempted: true, session, error: null });
  });
});
