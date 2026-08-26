import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';

const CIRCLE = 72;

/**
 * iOS-style glass circle + caption (Share / Copy).
 * Frosted look without BlurView — same OTA-safe approach as toasts.
 */
export function CreatePaymentLinkAction({
  iconName,
  label,
  onPress,
  testID,
  tint,
}) {
  const { colors, isDark } = useTheme();
  const iconColor = tint ?? colors.text;
  const labelColor = tint ?? colors.textMuted;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        col: {
          alignItems: 'center',
        },
        circle: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.52)',
          borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.78)',
          borderRadius: CIRCLE / 2,
          borderWidth: StyleSheet.hairlineWidth,
          elevation: 8,
          height: CIRCLE,
          justifyContent: 'center',
          overflow: 'hidden',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.28 : 0.08,
          shadowRadius: 16,
          width: CIRCLE,
        },
        sheen: {
          ...StyleSheet.absoluteFillObject,
        },
        pressed: {
          opacity: 0.72,
          transform: [{ scale: 0.96 }],
        },
        caption: {
          color: labelColor,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
          letterSpacing: -0.15,
          marginTop: 10,
          textAlign: 'center',
        },
      }),
    [isDark, labelColor],
  );

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View style={styles.col}>
          <View style={[styles.circle, pressed && styles.pressed]}>
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.02)']
                  : ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.18)']
              }
              end={{ x: 0.5, y: 1 }}
              pointerEvents="none"
              start={{ x: 0.5, y: 0 }}
              style={styles.sheen}
            />
            <Ionicons color={iconColor} name={iconName} size={28} />
          </View>
          <AppText numberOfLines={1} style={styles.caption}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}
