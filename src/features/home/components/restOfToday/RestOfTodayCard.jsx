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
  return (
    <SurfaceCard style={styles.card}>
      {[0, 1].map((k) => (
        <View key={k} style={styles.row}>
          <View style={styles.railCol}>
            <SkeletonBox
              borderRadius={7}
              height={14}
              pulse
              style={styles.markerCircle}
              width={14}
            />
            {k === 0 ? (
              <SkeletonBox borderRadius={2} height={40} pulse style={{ marginTop: 6 }} width={2} />
            ) : null}
          </View>
          <View style={styles.content}>
            <SkeletonBox borderRadius={8} height={13} pulse width={90} />
            <SkeletonBox borderRadius={8} height={16} pulse style={{ marginTop: 8 }} width="72%" />
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
      <SurfaceCard style={styles.card}>
        <InlineCardError message={error} />
      </SurfaceCard>
    );
  }

  if (!items.length) {
    return (
      <SurfaceCard style={styles.card}>
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.cardSurface }]}>
            <Ionicons color={colors.textMuted} name="calendar-outline" size={18} />
          </View>
          <AppText style={[styles.emptyTitle, { color: colors.text }]}>
            Nothing on the calendar
          </AppText>
          <AppText style={[styles.emptyBody, { color: colors.textMuted }]}>
            You do not have any appointments scheduled for today.
          </AppText>
        </View>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard style={styles.card}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const cancelled = item.statusKind === 'cancelled';
        const completed = item.statusKind === 'completed';
        const dotColor = timelineDotColor(item.statusKind, colors);
        const a11yStatus =
          item.statusKind === 'completed'
            ? 'Completed'
            : item.statusKind === 'cancelled'
              ? 'Canceled'
              : 'Upcoming';
        return (
          <View
            key={item.id}
            accessibilityLabel={`${item.time}. ${item.title}. ${a11yStatus}`}
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
              <AppText
                numberOfLines={2}
                style={[
                  styles.title,
                  { color: colors.text },
                  cancelled && { color: colors.textMuted, textDecorationLine: 'line-through' },
                ]}
              >
                {item.title}
              </AppText>
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
    paddingBottom: 14,
  },
  time: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
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
    fontWeight: '700',
    marginTop: 10,
  },
  emptyBody: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 4,
    textAlign: 'center',
  },
});
