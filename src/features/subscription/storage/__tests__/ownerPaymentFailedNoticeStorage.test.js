import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OWNER_PAYMENT_FAILED_NOTICE_DISMISSED_KEY,
  markOwnerPaymentFailedNoticeDismissed,
  parseDismissedOwnerPaymentFailedKeys,
  readDismissedOwnerPaymentFailedKeys,
} from '../ownerPaymentFailedNoticeStorage';

describe('ownerPaymentFailedNoticeStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('parses dismissed episode keys', () => {
    expect(parseDismissedOwnerPaymentFailedKeys(null)).toEqual([]);
    expect(parseDismissedOwnerPaymentFailedKeys('["sub_1:past_due:x"]')).toEqual([
      'sub_1:past_due:x',
    ]);
    expect(parseDismissedOwnerPaymentFailedKeys('{')).toEqual([]);
  });

  it('persists a dismissed episode key', async () => {
    await markOwnerPaymentFailedNoticeDismissed('sub_1:past_due:');
    expect(await readDismissedOwnerPaymentFailedKeys()).toEqual(['sub_1:past_due:']);
    expect(await AsyncStorage.getItem(OWNER_PAYMENT_FAILED_NOTICE_DISMISSED_KEY)).toContain(
      'sub_1:past_due:',
    );
  });
});
