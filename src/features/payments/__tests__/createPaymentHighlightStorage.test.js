import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CREATE_PAYMENT_HIGHLIGHT_SEEN_KEY,
  markCreatePaymentHighlightSeen,
  readCreatePaymentHighlightSeen,
} from '../create-payment/storage/createPaymentHighlightStorage';

describe('createPaymentHighlightStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('starts unseen', async () => {
    await expect(readCreatePaymentHighlightSeen()).resolves.toBe(false);
  });

  it('marks seen after the first FAB open', async () => {
    await markCreatePaymentHighlightSeen();
    await expect(AsyncStorage.getItem(CREATE_PAYMENT_HIGHLIGHT_SEEN_KEY)).resolves.toBe('1');
    await expect(readCreatePaymentHighlightSeen()).resolves.toBe(true);
  });
});
