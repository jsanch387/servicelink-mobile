import { DeviceEventEmitter } from 'react-native';
import { CREATE_PAYMENT_HIGHLIGHT_DEV_RESET_EVENT } from '../hooks/useCreatePaymentHighlight';
import { clearCreatePaymentHighlightSeen } from '../storage/createPaymentHighlightStorage';

/** Dev only — shows the Create payment FAB glow + New chip again. */
export async function resetCreatePaymentHighlightForDev() {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }
  await clearCreatePaymentHighlightSeen();
  DeviceEventEmitter.emit(CREATE_PAYMENT_HIGHLIGHT_DEV_RESET_EVENT);
}
