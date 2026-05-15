import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

/**
 * One-line Free plan booking usage (e.g. `3 / 5`).
 *
 * @param {{ used?: number; limit: number; loading?: boolean; error?: boolean }} props
 */
export function BookingsFreeTierUsageStrip({ used, limit, loading = false, error = false }) {
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
        badge: {
          borderColor: colors.border,
          borderRadius: 6,
          borderWidth: 1,
          flexShrink: 0,
          marginLeft: 10,
          paddingHorizontal: 8,
          paddingVertical: 3,
        },
        badgeText: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
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

  return (
    <View
      accessibilityLabel={
        error
          ? 'Free plan booking usage unavailable'
          : loading || used === undefined
            ? 'Loading free plan booking usage'
            : `Free plan: ${used} of ${limit} bookings used`
      }
      accessibilityRole="text"
      style={styles.wrap}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          <AppText includeFontPadding={false} style={styles.count}>
            {countLabel}
          </AppText>
          <AppText includeFontPadding={false} numberOfLines={1} style={styles.suffix}>
            bookings
          </AppText>
        </View>
        <View style={styles.badge}>
          <AppText includeFontPadding={false} style={styles.badgeText}>
            Free
          </AppText>
        </View>
      </View>
    </View>
  );
}
