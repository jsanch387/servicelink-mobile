import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SWIPE_TO_REMOVE_JOB_TIP_SEEN_KEY,
  hasSeenSwipeToRemoveJobTip,
  markSwipeToRemoveJobTipSeen,
} from '../utils/swipeToRemoveJobTipStorage';

describe('swipeToRemoveJobTipStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('starts unseen', async () => {
    await expect(hasSeenSwipeToRemoveJobTip()).resolves.toBe(false);
  });

  it('marks seen after Got it', async () => {
    await markSwipeToRemoveJobTipSeen();
    await expect(AsyncStorage.getItem(SWIPE_TO_REMOVE_JOB_TIP_SEEN_KEY)).resolves.toBe('1');
    await expect(hasSeenSwipeToRemoveJobTip()).resolves.toBe(true);
  });
});
