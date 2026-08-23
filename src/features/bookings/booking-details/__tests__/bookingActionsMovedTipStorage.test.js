import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BOOKING_ACTIONS_MOVED_TIP_SEEN_KEY,
  hasSeenBookingActionsMovedTip,
  markBookingActionsMovedTipSeen,
} from '../storage/bookingActionsMovedTipStorage';

describe('bookingActionsMovedTipStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('starts unseen', async () => {
    await expect(hasSeenBookingActionsMovedTip()).resolves.toBe(false);
  });

  it('marks seen after dismiss', async () => {
    await markBookingActionsMovedTipSeen();
    await expect(AsyncStorage.getItem(BOOKING_ACTIONS_MOVED_TIP_SEEN_KEY)).resolves.toBe('1');
    await expect(hasSeenBookingActionsMovedTip()).resolves.toBe(true);
  });
});
