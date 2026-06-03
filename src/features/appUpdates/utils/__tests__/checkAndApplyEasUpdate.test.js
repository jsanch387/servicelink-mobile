jest.mock('expo-updates', () => ({
  get isEnabled() {
    return mockUpdatesEnabled;
  },
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

let mockUpdatesEnabled = true;

const Updates = require('expo-updates');
const { checkAndApplyEasUpdate } = require('../checkAndApplyEasUpdate');

describe('checkAndApplyEasUpdate', () => {
  const originalDev = global.__DEV__;

  beforeAll(() => {
    global.__DEV__ = false;
  });

  afterAll(() => {
    global.__DEV__ = originalDev;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdatesEnabled = true;
  });

  it('returns disabled when expo-updates is not enabled', async () => {
    mockUpdatesEnabled = false;

    await expect(checkAndApplyEasUpdate()).resolves.toEqual({
      applied: false,
      reason: 'disabled',
    });
    expect(Updates.checkForUpdateAsync).not.toHaveBeenCalled();
  });

  it('returns none when no update is available', async () => {
    Updates.checkForUpdateAsync.mockResolvedValue({ isAvailable: false });

    await expect(checkAndApplyEasUpdate()).resolves.toEqual({
      applied: false,
      reason: 'none',
    });
    expect(Updates.fetchUpdateAsync).not.toHaveBeenCalled();
  });

  it('fetches and reloads when an update is available', async () => {
    Updates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    Updates.fetchUpdateAsync.mockResolvedValue(undefined);
    Updates.reloadAsync.mockResolvedValue(undefined);

    await expect(checkAndApplyEasUpdate()).resolves.toEqual({ applied: true });
    expect(Updates.fetchUpdateAsync).toHaveBeenCalledTimes(1);
    expect(Updates.reloadAsync).toHaveBeenCalledTimes(1);
  });

  it('returns error when the update check fails', async () => {
    Updates.checkForUpdateAsync.mockRejectedValue(new Error('network'));

    await expect(checkAndApplyEasUpdate()).resolves.toEqual({
      applied: false,
      reason: 'error',
    });
  });
});
