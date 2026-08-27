import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText, InlineCardError, SkeletonBox, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

function timelineDotColor(statusKind, colors) {
  if (statusKind === 'cancelled') {
    return colors.danger;
  }
  return colors.text;
}

function RestOfTodaySkeleton() {
  const { colors } = useTheme();

  return (
    <SurfaceCard
      accessibilityLabel="Loading today's timeline"
      accessibilityRole="progressbar"
      outlined={false}
      style={styles.card}
    >
      {[0, 1, 2].map((k) => (
        <View key={k} style={styles.row}>
          <View style={styles.railCol}>
            <SkeletonBox
              borderRadius={7}
              height={14}
              pulse
              style={styles.markerCircle}
              width={14}
            />
            {k < 2 ? (
              <View style={[styles.rail, { backgroundColor: colors.borderStrong }]} />
            ) : null}
          </View>
          <View style={styles.content}>
            <SkeletonBox borderRadius={6} height={13} pulse width={k === 1 ? 72 : 90} />
            <SkeletonBox
              borderRadius={6}
              height={16}
              pulse
              style={styles.skeletonTitle}
              width={k === 0 ? '72%' : '58%'}
            />
          </View>
        </View>
      ))}
    </SurfaceCard>
  );
}

export function RestOfTodayCard({ items, isLoading, error }) {
  const { colors } = useTheme();

  if (isLoading) {
    return <RestOfTodaySkeleton />;
  }

  if (error) {
    return (
      <SurfaceCard outlined={false} style={styles.card}>
        <InlineCardError message={error} />
      </SurfaceCard>
    );
  }

  if (!items.length) {
    return (
      <SurfaceCard outlined={false} style={styles.card}>
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.shellElevated }]}>
            <Ionicons color={colors.textMuted} name="time-outline" size={18} />
          </View>
          <AppText style={[styles.emptyTitle, { color: colors.textMuted }]}>
            Nothing scheduled today
          </AppText>
        </View>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard outlined={false} style={styles.card}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const cancelled = item.statusKind === 'cancelled';
        const completed = item.statusKind === 'completed';
        const dotColor = timelineDotColor(item.statusKind, colors);
        const extraCount = Math.max(0, Math.round(Number(item.extraCount) || 0));
        const a11yStatus =
          item.statusKind === 'completed'
            ? 'Completed'
            : item.statusKind === 'cancelled'
              ? 'Canceled'
              : 'Upcoming';
        const a11yTitle = extraCount > 0 ? `${item.title} +${extraCount} more` : item.title;
        return (
          <View
            key={item.id}
            accessibilityLabel={`${item.time}. ${a11yTitle}. ${a11yStatus}`}
            accessibilityRole="text"
            style={styles.row}
          >
            <View style={styles.railCol}>
              <View
                style={[
                  styles.markerCircle,
                  { backgroundColor: completed ? colors.timelineCompletedFill : dotColor },
                ]}
              >
                {completed ? (
                  <Ionicons
                    color={colors.timelineCompletedCheck}
                    importantForAccessibility="no"
                    name="checkmark"
                    size={9}
                  />
                ) : null}
              </View>
              {!isLast ? (
                <View style={[styles.rail, { backgroundColor: colors.borderStrong }]} />
              ) : null}
            </View>
            <View style={styles.content}>
              <AppText style={[styles.time, { color: colors.textSecondary }]}>{item.time}</AppText>
              <View style={styles.titleRow}>
                <AppText
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  style={[
                    styles.title,
                    { color: colors.text },
                    cancelled && { color: colors.textMuted, textDecorationLine: 'line-through' },
                  ]}
                >
                  {item.title}
                </AppText>
                {extraCount > 0 ? (
                  <AppText
                    numberOfLines={1}
                    style={[
                      styles.titleMore,
                      { color: colors.textMuted },
                      cancelled && { textDecorationLine: 'line-through' },
                    ]}
                  >
                    {`+${extraCount} more`}
                  </AppText>
                ) : null}
              </View>
            </View>
          </View>
        );
      })}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    minHeight: 52,
  },
  railCol: {
    alignItems: 'center',
    marginRight: 12,
    width: 14,
  },
  /** Same outer size for upcoming / canceled dots and completed (green + check). */
  markerCircle: {
    alignItems: 'center',
    borderRadius: 7,
    height: 14,
    justifyContent: 'center',
    marginTop: 2,
    width: 14,
  },
  rail: {
    flex: 1,
    marginTop: 6,
    width: 2,
  },
  content: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 14,
  },
  time: {
    fontSize: 13,
    fontWeight: '600',
  },
  skeletonTitle: {
    marginTop: 4,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    minWidth: 0,
  },
  title: {
    flexGrow: 0,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 0,
  },
  titleMore: {
    flexGrow: 0,
    flexShrink: 0,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 22,
  },
  emptyIconWrap: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
});
