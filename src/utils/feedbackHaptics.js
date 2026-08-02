import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

/**
 * Shared success / error notification haptics for the app.
 * Prefer these helpers over calling expo-haptics directly so feedback stays consistent.
 */

export function fireSuccessHaptic() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
    if (Platform.OS === 'android') {
      Vibration.vibrate(40);
    }
  });
}

export function fireErrorHaptic() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {
    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 35, 60, 35]);
    }
  });
}

export function fireLightImpactHaptic() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
    if (Platform.OS === 'android') {
      Vibration.vibrate(12);
    }
  });
}

export function fireSelectionHaptic() {
  void Haptics.selectionAsync().catch(() => {});
}
