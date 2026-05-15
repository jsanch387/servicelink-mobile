import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

/**
 * One-line Free plan booking usage (e.g. `3 / 5 free bookings`) + Upgrade to Account.
 *
 * @param {{
 *   used?: number;
 *   limit: number;
 *   loading?: boolean;
 *   error?: boolean;
 *   onUpgradePress?: () => void;
 * }} props
 */
export function BookingsFreeTierUsageStrip({
  used,
  limit,
  loading = false,
  error = false,
  onUpgradePress,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignSelf: 'stretch',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 10,
          borderWidth: 1,
          marginBottom: 2,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        left: {
          alignItems: 'baseline',
          flexDirection: 'row',
          flexShrink: 1,
          gap: 6,
          minWidth: 0,
        },
        count: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        suffix: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
        },
        upgradePressable: {
          borderColor: colors.accent,
          borderRadius: 6,
          borderWidth: 1,
          flexShrink: 0,
          marginLeft: 10,
          paddingHorizontal: 10,
          paddingVertical: 5,
        },
        upgradeText: {
          color: colors.accent,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }),
    [colors],
  );

  const countLabel = useMemo(() => {
    if (error) {
      return '—';
    }
    if (loading || used === undefined) {
      return '…';
    }
    return `${used} / ${limit}`;
  }, [error, loading, used, limit]);

  const summaryA11y = useMemo(() => {
    if (error) {
      return 'Free plan booking usage unavailable';
    }
    if (loading || used === undefined) {
      return 'Loading free plan booking usage';
    }
    return `Free plan: ${used} of ${limit} free bookings used`;
  }, [error, loading, used, limit]);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View
          accessibilityLabel={summaryA11y}
          accessibilityRole="text"
          accessible
          style={styles.left}
        >
          <AppText includeFontPadding={false} style={styles.count}>
            {countLabel}
          </AppText>
          <AppText includeFontPadding={false} numberOfLines={1} style={styles.suffix}>
            free bookings
          </AppText>
        </View>
        {onUpgradePress ? (
          <Pressable
            accessibilityHint="Opens Account to manage your plan"
            accessibilityLabel="Upgrade"
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => [styles.upgradePressable, pressed && { opacity: 0.85 }]}
            onPress={onUpgradePress}
          >
            <AppText includeFontPadding={false} style={styles.upgradeText}>
              Upgrade
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
