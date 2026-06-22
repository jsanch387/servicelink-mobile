import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearTapToPayEducationSeen,
  hasSeenTapToPayEducation,
  markTapToPayEducationSeen,
  TAP_TO_PAY_EDUCATION_SEEN_KEY,
} from '../education/tapToPayEducationStorage';

describe('tapToPayEducationStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('starts unseen', async () => {
    await expect(hasSeenTapToPayEducation()).resolves.toBe(false);
  });

  it('marks seen', async () => {
    await markTapToPayEducationSeen();
    await expect(AsyncStorage.getItem(TAP_TO_PAY_EDUCATION_SEEN_KEY)).resolves.toBe('1');
    await expect(hasSeenTapToPayEducation()).resolves.toBe(true);
  });

  it('clears seen flag', async () => {
    await markTapToPayEducationSeen();
    await clearTapToPayEducationSeen();
    await expect(hasSeenTapToPayEducation()).resolves.toBe(false);
  });
});
