import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  hasSeenNotificationPermissionPrimer,
  markNotificationPermissionPrimerSeen,
  notificationPermissionPrimerSeenKey,
} from '../notificationPermissionPrimerStorage';

describe('notificationPermissionPrimerStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('starts unseen for a user', async () => {
    await expect(hasSeenNotificationPermissionPrimer('user-1')).resolves.toBe(false);
  });

  it('marks seen per user', async () => {
    await markNotificationPermissionPrimerSeen('user-1');
    await expect(AsyncStorage.getItem(notificationPermissionPrimerSeenKey('user-1'))).resolves.toBe(
      '1',
    );
    await expect(hasSeenNotificationPermissionPrimer('user-1')).resolves.toBe(true);
    await expect(hasSeenNotificationPermissionPrimer('user-2')).resolves.toBe(false);
  });

  it('ignores empty user ids', async () => {
    await markNotificationPermissionPrimerSeen('');
    await expect(hasSeenNotificationPermissionPrimer('')).resolves.toBe(false);
  });
});
