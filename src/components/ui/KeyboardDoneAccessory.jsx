import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

/** Shared nativeID for iOS keyboard Done toolbar — mount {@link KeyboardDoneAccessory} once in the app tree. */
export const KEYBOARD_DONE_ACCESSORY_ID = 'servicelink-keyboard-done';

/**
 * Props to spread onto TextInput so single-line fields get a Done bar on iOS
 * (name, email, phone, street, price, ZIP — every appointment create field).
 *
 * @param {{
 *   existingAccessoryId?: string;
 *   multiline?: boolean;
 * }} [options]
 */
export function iosKeyboardDoneAccessoryInputProps({
  existingAccessoryId,
  multiline = false,
} = {}) {
  if (Platform.OS !== 'ios') return {};
  if (existingAccessoryId) return { inputAccessoryViewID: existingAccessoryId };
  if (multiline) return {};
  return { inputAccessoryViewID: KEYBOARD_DONE_ACCESSORY_ID };
}

/**
 * iOS toolbar with Done above the keyboard. No-op on Android.
 * Mount once near the app root so all fields using {@link KEYBOARD_DONE_ACCESSORY_ID} share it.
 */
export function KeyboardDoneAccessory() {
  const { colors, isDark } = useTheme();

  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <InputAccessoryView nativeID={KEYBOARD_DONE_ACCESSORY_ID}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: isDark ? '#1c1c1e' : '#d1d5db',
            borderTopColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          },
        ]}
      >
        <View style={styles.spacer} />
        <Pressable
          accessibilityLabel="Done"
          accessibilityRole="button"
          hitSlop={8}
          onPress={Keyboard.dismiss}
          style={styles.doneHit}
        >
          <AppText style={[styles.doneLabel, { color: colors.accent }]}>Done</AppText>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    minHeight: 44,
    paddingHorizontal: 12,
    width: '100%',
  },
  spacer: {
    flex: 1,
  },
  doneHit: {
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  doneLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
});
