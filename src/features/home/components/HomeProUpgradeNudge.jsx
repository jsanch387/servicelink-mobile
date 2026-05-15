import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  AppText,
  ProCrownIcon,
  PRO_CROWN_COLOR_FEATURE,
  SurfaceCard,
} from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { FREE_TIER_BOOKINGS_LIMIT } from '../../bookings/constants';

/**
 * Compact home-row nudge for non‑Pro owners — opens Account (subscription) on tap.
 * When `mode` is `free_booking_cap`, copy reflects the free booking cap (e.g. 5/5 + upgrade for unlimited).
 *
 * @param {{
 *   onPress: () => void;
 *   mode?: 'default' | 'free_booking_cap';
 *   capUsed?: number;
 *   capLimit?: number;
 * }} props
 */
export function HomeProUpgradeNudge({
  onPress,
  mode = 'default',
  capUsed,
  capLimit = FREE_TIER_BOOKINGS_LIMIT,
}) {
  const { colors } = useTheme();

  const capMode =
    mode === 'free_booking_cap' &&
    typeof capUsed === 'number' &&
    Number.isFinite(capUsed) &&
    typeof capLimit === 'number' &&
    Number.isFinite(capLimit);

  const a11yLabel = capMode
    ? `Free plan: ${capUsed} of ${capLimit} bookings used. Upgrade to Pro for unlimited bookings.`
    : 'Upgrade to Pro';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          alignSelf: 'stretch',
          marginBottom: 12,
          marginTop: 4,
        },
        pressable: {
          alignSelf: 'stretch',
          width: '100%',
        },
        pressed: {
          opacity: 0.88,
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          justifyContent: 'flex-start',
          minHeight: capMode ? 52 : 44,
          paddingHorizontal: 14,
          paddingVertical: capMode ? 12 : 10,
          width: '100%',
        },
        iconSlot: {
          alignItems: 'center',
          alignSelf: 'center',
          flexShrink: 0,
          height: 24,
          justifyContent: 'center',
          marginRight: 10,
          width: 24,
        },
        label: {
          color: colors.text,
          flexBasis: 0,
          flexGrow: 1,
          flexShrink: 1,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: -0.2,
          lineHeight: 20,
          minWidth: 0,
        },
        subLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.05,
          lineHeight: 18,
          marginTop: 4,
        },
        textColumn: {
          flexBasis: 0,
          flexGrow: 1,
          flexShrink: 1,
          minWidth: 0,
        },
        chevronSlot: {
          alignItems: 'center',
          alignSelf: 'center',
          flexShrink: 0,
          height: 32,
          justifyContent: 'center',
          marginLeft: 4,
          width: 28,
        },
      }),
    [capMode, colors],
  );

  return (
    <SurfaceCard outlined padding="none" style={styles.card}>
      <Pressable
        accessibilityHint="Opens your account to upgrade"
        accessibilityLabel={a11yLabel}
        accessibilityRole="button"
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
        onPress={onPress}
      >
        <View style={styles.row}>
          {!capMode ? (
            <View style={styles.iconSlot}>
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <ProCrownIcon color={PRO_CROWN_COLOR_FEATURE} size={17} />
              </View>
            </View>
          ) : null}
          {capMode ? (
            <View style={styles.textColumn}>
              <AppText includeFontPadding={false} style={styles.label}>
                {capUsed} / {capLimit} free bookings
              </AppText>
              <AppText includeFontPadding={false} style={styles.subLabel}>
                Upgrade to Pro for unlimited bookings
              </AppText>
            </View>
          ) : (
            <AppText includeFontPadding={false} numberOfLines={1} style={styles.label}>
              Upgrade to Pro
            </AppText>
          )}
          <View style={styles.chevronSlot}>
            <Ionicons color={colors.textMuted} name="chevron-forward" size={20} />
          </View>
        </View>
      </Pressable>
    </SurfaceCard>
  );
}
