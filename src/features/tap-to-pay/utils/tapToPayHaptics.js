import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

export function fireTapToPaySuccessHaptic() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
    if (Platform.OS === 'android') {
      Vibration.vibrate(40);
    }
  });
}

export function fireTapToPayErrorHaptic() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {
    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 35, 60, 35]);
    }
  });
}

export function fireTapToPayCollectStartHaptic() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function fireTapToPayRetryHaptic() {
  void Haptics.selectionAsync().catch(() => {});
}
