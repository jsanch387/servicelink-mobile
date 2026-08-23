import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

/**
 * Nav header leading label (Cancel / Back / Done).
 * Sized so iOS 26 glass capsules keep the word optically centered.
 */
export function HeaderTextButton({
  label,
  onPress,
  accessibilityLabel,
  testID,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        face: {
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 34,
          minWidth: 44,
          paddingHorizontal: 12,
        },
        pressed: {
          opacity: 0.55,
        },
        label: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '400',
          includeFontPadding: false,
          letterSpacing: -0.2,
          lineHeight: 20,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View style={[styles.face, pressed && styles.pressed]}>
          <AppText style={styles.label}>{label}</AppText>
        </View>
      )}
    </Pressable>
  );
}
