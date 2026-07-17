import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText, SkeletonBox, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

function formatUsd(cents) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Daily booked earnings and payment progress for scheduled work. */
export function TodaysPotentialCard({ potentialCents = 0, collectedCents = 0, isLoading = false }) {
  const { colors } = useTheme();
  const remainingCents = Math.max(potentialCents - collectedCents, 0);
  const collectedPercent =
    potentialCents > 0 ? Math.min(Math.round((collectedCents / potentialCents) * 100), 100) : 0;

  if (isLoading) {
    return (
      <SurfaceCard
        accessibilityLabel="Loading today's earnings"
        accessibilityRole="progressbar"
        style={styles.card}
      >
        <View style={styles.contentRow}>
          <View style={styles.potentialBlock}>
            <SkeletonBox borderRadius={10} height={36} pulse width={36} />
            <SkeletonBox
              borderRadius={8}
              height={30}
              pulse
              style={styles.skeletonAmount}
              width={92}
            />
          </View>
          <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
          <View style={styles.metricsColumn}>
            {[0, 1].map((key) => (
              <View key={key} style={styles.metricRow}>
                <SkeletonBox borderRadius={5} height={10} pulse width={58} />
                <SkeletonBox borderRadius={6} height={14} pulse width={42} />
              </View>
            ))}
          </View>
        </View>
        <SkeletonBox borderRadius={99} height={5} pulse style={styles.progressTrack} />
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard
      accessibilityLabel={`Today's money. ${formatUsd(
        potentialCents,
      )} potential, ${formatUsd(collectedCents)} collected, ${formatUsd(
        remainingCents,
      )} remaining.`}
      accessibilityRole="summary"
      style={styles.card}
    >
      <View style={styles.contentRow}>
        <View style={styles.potentialBlock}>
          <View style={[styles.iconWrap, { backgroundColor: colors.buttonSecondaryBg }]}>
            <Ionicons
              color={colors.moneyPositive}
              importantForAccessibility="no"
              name="cash-outline"
              size={20}
            />
          </View>
          <AppText style={[styles.amount, { color: colors.text }]}>
            {formatUsd(potentialCents)}
          </AppText>
        </View>
        <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
        <View style={styles.metricsColumn}>
          <View style={styles.metricRow}>
            <AppText style={[styles.metricLabel, { color: colors.textMuted }]}>Collected</AppText>
            <AppText style={[styles.metricValue, { color: colors.moneyPositive }]}>
              {formatUsd(collectedCents)}
            </AppText>
          </View>
          <View style={styles.metricRow}>
            <AppText style={[styles.metricLabel, { color: colors.textMuted }]}>Remaining</AppText>
            <AppText style={[styles.metricValue, { color: colors.text }]}>
              {formatUsd(remainingCents)}
            </AppText>
          </View>
        </View>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.borderStrong }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.moneyPositive,
              width: `${collectedPercent}%`,
            },
          ]}
        />
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  contentRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
  },
  potentialBlock: {
    flex: 1,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  amount: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 35,
    marginTop: 12,
  },
  skeletonAmount: {
    marginTop: 12,
  },
  verticalDivider: {
    marginHorizontal: 16,
    width: 1,
  },
  metricsColumn: {
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    minWidth: 0,
  },
  metricRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTrack: {
    borderRadius: 99,
    height: 5,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 99,
    height: '100%',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});
