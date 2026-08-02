import * as Haptics from 'expo-haptics';
import {
  fireErrorHaptic,
  fireSelectionHaptic,
  fireSuccessHaptic,
} from '../../../utils/feedbackHaptics';

/** @deprecated Prefer {@link fireSuccessHaptic} from `utils/feedbackHaptics`. */
export function fireTapToPaySuccessHaptic() {
  fireSuccessHaptic();
}

/** @deprecated Prefer {@link fireErrorHaptic} from `utils/feedbackHaptics`. */
export function fireTapToPayErrorHaptic() {
  fireErrorHaptic();
}

export function fireTapToPayCollectStartHaptic() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function fireTapToPayRetryHaptic() {
  fireSelectionHaptic();
}
