import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

/**
 * Read-only free-tier booking usage for Bookings list (no upgrade CTA — App Store).
 *
 * @param {{
 *   used?: number;
 *   limit: number;
 *   loading?: boolean;
 *   error?: boolean;
 * }} props
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
        labelCol: {
          flex: 1,
          justifyContent: 'center',
          marginRight: 12,
          minWidth: 0,
        },
        label: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: -0.05,
        },
        fraction: {
          alignItems: 'baseline',
          flexDirection: 'row',
          flexShrink: 0,
        },
        count: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        limit: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
        },
      }),
    [colors],
  );

  const safeUsed =
    error || loading || used === undefined ? null : Math.max(0, Math.min(used, limit));

  const countLabel = useMemo(() => {
    if (error) {
      return '—';
    }
    if (loading || used === undefined) {
      return '…';
    }
    return String(safeUsed);
  }, [error, loading, safeUsed, used]);

  const summaryA11y = useMemo(() => {
    if (error) {
      return 'Free bookings used unavailable';
    }
    if (loading || used === undefined) {
      return 'Loading free bookings used';
    }
    return `Free bookings used: ${safeUsed} of ${limit}.`;
  }, [error, limit, loading, safeUsed, used]);

  return (
    <View style={styles.wrap}>
      <View
        accessibilityLabel={summaryA11y}
        accessibilityRole="summary"
        accessible
        style={styles.row}
      >
        <View style={styles.labelCol}>
          <AppText includeFontPadding={false} numberOfLines={1} style={styles.label}>
            Free bookings used
          </AppText>
        </View>
        <View style={styles.fraction}>
          <AppText includeFontPadding={false} style={styles.count}>
            {countLabel}
          </AppText>
          {!error && !loading && used !== undefined ? (
            <AppText includeFontPadding={false} style={styles.limit}>
              {' '}
              / {limit}
            </AppText>
          ) : null}
        </View>
      </View>
    </View>
  );
}
