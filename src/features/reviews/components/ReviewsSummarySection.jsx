import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { REVIEW_STAR_COLOR } from '../constants';
import { StarRating } from './StarRating';

/**
 * Flat rating summary (no card shell). Used on booking-link Reviews tab and inside {@link ReviewsSummaryCard}.
 *
 * @param {{ averageRating: number; totalCount: number; breakdown: { stars: number; percent: number }[]; showBreakdownDivider?: boolean }} props
 */
export function ReviewsSummarySection({
  averageRating,
  totalCount,
  breakdown,
  showBreakdownDivider = true,
}) {
  const { colors } = useTheme();

  const averageLabel = useMemo(() => averageRating.toFixed(1), [averageRating]);

  const reviewCountLabel = useMemo(() => {
    if (totalCount === 0) return '0 reviews';
    if (totalCount === 1) return '1 review';
    return `${totalCount} reviews`;
  }, [totalCount]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        topRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 16,
        },
        average: {
          color: colors.text,
          fontSize: 40,
          fontWeight: '700',
          letterSpacing: -1,
          lineHeight: 44,
        },
        starsBlock: {
          flex: 1,
          gap: 6,
          minWidth: 0,
        },
        count: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
        },
        divider: {
          backgroundColor: colors.border,
          height: 1,
          marginVertical: 18,
        },
        breakdown: {
          gap: 10,
          marginTop: showBreakdownDivider ? 0 : 18,
        },
        breakdownRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
        },
        starLabel: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
          textAlign: 'right',
          width: 14,
        },
        barTrack: {
          backgroundColor: colors.border,
          borderRadius: 4,
          flex: 1,
          height: 8,
          overflow: 'hidden',
        },
        barFill: {
          backgroundColor: REVIEW_STAR_COLOR,
          borderRadius: 4,
          height: '100%',
        },
        percentLabel: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
          textAlign: 'right',
          width: 36,
        },
      }),
    [colors, showBreakdownDivider],
  );

  return (
    <View>
      <View style={styles.topRow}>
        <AppText style={styles.average}>{averageLabel}</AppText>
        <View style={styles.starsBlock}>
          <StarRating rating={averageRating} size={18} gap={3} />
          <AppText style={styles.count}>{reviewCountLabel}</AppText>
        </View>
      </View>

      {showBreakdownDivider ? <View style={styles.divider} /> : null}

      <View style={styles.breakdown}>
        {breakdown.map((row) => (
          <View key={row.stars} style={styles.breakdownRow}>
            <AppText style={styles.starLabel}>{row.stars}</AppText>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${row.percent}%` }]} />
            </View>
            <AppText style={styles.percentLabel}>{row.percent}%</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}
