import { DeviceEventEmitter } from 'react-native';
import { clearSeenNextUpCoachTips } from '../storage/nextUpCoachTipStorage';
import { clearOnMyWayTryItSeen } from '../storage/nextUpOnMyWayTryItStorage';
import { NEXT_UP_COACH_TIPS_DEV_RESET_EVENT } from '../hooks/useNextUpCoachTip';
import { NEXT_UP_ON_MY_WAY_TRY_IT_DEV_RESET_EVENT } from '../hooks/useOnMyWayTryItBadge';

/** Dev only — clears Next Up coach tips + Try it pill so they can be previewed again. */
export async function resetNextUpCoachTipsForDev() {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }
  await Promise.all([clearSeenNextUpCoachTips(), clearOnMyWayTryItSeen()]);
  DeviceEventEmitter.emit(NEXT_UP_COACH_TIPS_DEV_RESET_EVENT);
  DeviceEventEmitter.emit(NEXT_UP_ON_MY_WAY_TRY_IT_DEV_RESET_EVENT);
}
