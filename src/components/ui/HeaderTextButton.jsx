import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

/** Wide enough for "Cancel" so Android header left/right slots stay equal. */
export const HEADER_BAR_SIDE_SLOT_WIDTH = 88;

/**
 * Equal-width header side slot. Pair left + right on Android so the title stays
 * on the true screen center when the leading action is a text button.
 */
export function HeaderBarSideSlot({ children, align = 'center' }) {
  return (
    <View
      style={{
        alignItems: align,
        justifyContent: 'center',
        width: HEADER_BAR_SIDE_SLOT_WIDTH,
      }}
    >
      {children}
    </View>
  );
}

/** Empty trailing slot so Android native headers keep the title centered. */
export function androidHeaderTitleBalanceRight() {
  if (Platform.OS !== 'android') {
    return undefined;
  }
  return () => <HeaderBarSideSlot />;
}

/**
 * Wrap a leading header action so Android title centering is not pulled off-center.
 *
 * @param {() => import('react').ReactNode} renderLeft
 */
export function androidBalancedHeaderLeft(renderLeft) {
  if (Platform.OS !== 'android') {
    return renderLeft;
  }
  return () => <HeaderBarSideSlot align="flex-start">{renderLeft()}</HeaderBarSideSlot>;
}

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
