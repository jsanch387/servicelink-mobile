import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

const BAR_HEIGHT = 40;
const CHEVRON_SIZE = 32;
const BAR_RADIUS = 10;

/**
 * Previous / label / next bar. Same translucent track as the bookings list/calendar toggle.
 *
 * @param {{
 *   label: string;
 *   onPrevious: () => void;
 *   onNext: () => void;
 *   previousLabel: string;
 *   nextLabel: string;
 *   previousDisabled?: boolean;
 *   nextDisabled?: boolean;
 *   appearance?: 'bar' | 'plain';
 *   style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
 * }} props
 */
export function PeriodNav({
  label,
  onPrevious,
  onNext,
  previousLabel,
  nextLabel,
  previousDisabled = false,
  nextDisabled = false,
  appearance = 'bar',
  style,
}) {
  const { colors, isDark } = useTheme();
  const plain = appearance === 'plain';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          alignItems: 'center',
          alignSelf: 'stretch',
          backgroundColor: plain
            ? 'transparent'
            : isDark
              ? 'rgba(255,255,255,0.07)'
              : 'rgba(255,255,255,0.42)',
          borderColor: plain
            ? 'transparent'
            : isDark
              ? 'rgba(255,255,255,0.12)'
              : 'rgba(0,0,0,0.08)',
          borderRadius: plain ? 0 : BAR_RADIUS,
          borderWidth: plain ? 0 : StyleSheet.hairlineWidth,
          flexDirection: 'row',
          height: BAR_HEIGHT,
          overflow: plain ? 'visible' : 'hidden',
          paddingHorizontal: plain ? 0 : 4,
          ...(plain
            ? null
            : Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: isDark ? 0.28 : 0.08,
                  shadowRadius: 8,
                },
              })),
        },
        hit: {
          alignItems: 'center',
          height: CHEVRON_SIZE,
          justifyContent: 'center',
          width: CHEVRON_SIZE,
        },
        center: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
          paddingHorizontal: 4,
        },
        label: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
          textAlign: 'center',
        },
      }),
    [colors, isDark, plain],
  );

  return (
    <View style={[styles.bar, style]}>
      <Pressable
        accessibilityLabel={previousLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: previousDisabled }}
        disabled={previousDisabled}
        hitSlop={6}
        onPress={onPrevious}
      >
        {({ pressed }) => (
          <View
            style={[
              styles.hit,
              (pressed || previousDisabled) && { opacity: previousDisabled ? 0.35 : 0.7 },
            ]}
          >
            <Ionicons color={colors.text} name="chevron-back" size={18} />
          </View>
        )}
      </Pressable>
      <View style={styles.center}>
        <AppText numberOfLines={1} style={styles.label}>
          {label}
        </AppText>
      </View>
      <Pressable
        accessibilityLabel={nextLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: nextDisabled }}
        disabled={nextDisabled}
        hitSlop={6}
        onPress={onNext}
      >
        {({ pressed }) => (
          <View
            style={[
              styles.hit,
              (pressed || nextDisabled) && { opacity: nextDisabled ? 0.35 : 0.7 },
            ]}
          >
            <Ionicons color={colors.text} name="chevron-forward" size={18} />
          </View>
        )}
      </Pressable>
    </View>
  );
}
