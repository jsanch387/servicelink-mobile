import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

const MIN_INTERVAL_MS = 90;

let lastWheelHapticAt = 0;

/** Light tick while scrolling picker wheels (throttled; iOS selection haptic, short vibrate fallback). */
export function triggerWheelSelectionHaptic() {
  if (Platform.OS === 'web') return;
  const now = Date.now();
  if (now - lastWheelHapticAt < MIN_INTERVAL_MS) return;
  lastWheelHapticAt = now;
  void Haptics.selectionAsync().catch(() => {
    Vibration.vibrate(6);
  });
}
