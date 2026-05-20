import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

/**
 * Read-only free-tier booking usage for Home (no upgrade CTA — App Store).
 *
 * @param {{ used: number; limit: number }} props
 */
export function HomeFreeBookingsUsageCard({ used, limit }) {
  const { colors } = useTheme();
  const safeUsed = Math.max(0, Math.min(used, limit));
  const atLimit = safeUsed >= limit;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          alignSelf: 'stretch',
          justifyContent: 'center',
          marginBottom: 10,
          marginTop: 4,
          minHeight: 44,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        header: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        label: {
          color: colors.textMuted,
          flex: 1,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: -0.05,
          lineHeight: 16,
          marginRight: 12,
        },
        fraction: {
          alignItems: 'center',
          flexDirection: 'row',
          flexShrink: 0,
        },
        used: {
          color: atLimit ? colors.textMuted : colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.35,
          lineHeight: 22,
        },
        limit: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 22,
        },
      }),
    [atLimit, colors],
  );

  const a11yLabel = `Free bookings used: ${safeUsed} of ${limit}.`;

  return (
    <SurfaceCard
      accessibilityLabel={a11yLabel}
      accessibilityRole="summary"
      outlined
      padding="none"
      style={styles.card}
    >
      <View style={styles.header}>
        <AppText includeFontPadding={false} style={styles.label}>
          Free bookings used
        </AppText>
        <View style={styles.fraction}>
          <AppText includeFontPadding={false} style={styles.used}>
            {safeUsed}
          </AppText>
          <AppText includeFontPadding={false} style={styles.limit}>
            {' '}
            / {limit}
          </AppText>
        </View>
      </View>
    </SurfaceCard>
  );
}
