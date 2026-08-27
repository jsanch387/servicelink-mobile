import { DeviceEventEmitter } from 'react-native';
import { OWNER_PAYMENT_FAILED_NOTICE_DEV_RESET_EVENT } from '../hooks/useOwnerSubscriptionPaymentFailedNotice';
import { clearDismissedOwnerPaymentFailedNotices } from '../storage/ownerPaymentFailedNoticeStorage';

/** Dev only — clears the dismissed Pro payment-failed heads-up so it can show again. */
export async function resetOwnerPaymentFailedNoticeForDev() {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }
  await clearDismissedOwnerPaymentFailedNotices();
  DeviceEventEmitter.emit(OWNER_PAYMENT_FAILED_NOTICE_DEV_RESET_EVENT);
}
