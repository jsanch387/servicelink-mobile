import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import {
  InlineCardError,
  SkeletonBox,
  SurfaceCard,
} from "../../../../components/ui";
import { useTheme } from "../../../../theme";

function RestOfTodaySkeleton() {
  return (
    <SurfaceCard style={styles.card}>
      {[0, 1].map((k) => (
        <View key={k} style={styles.row}>
          <View style={styles.railCol}>
            <SkeletonBox borderRadius={5} height={10} width={10} />
            {k === 0 ? (
              <SkeletonBox
                borderRadius={2}
                height={40}
                style={{ marginTop: 6 }}
                width={2}
              />
            ) : null}
          </View>
          <View style={styles.content}>
            <SkeletonBox borderRadius={8} height={13} width={90} />
            <SkeletonBox
              borderRadius={8}
              height={16}
              style={{ marginTop: 8 }}
              width="72%"
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
      <SurfaceCard style={styles.card}>
        <InlineCardError message={error} />
      </SurfaceCard>
    );
  }

  if (!items.length) {
    return (
      <SurfaceCard style={styles.card}>
        <View style={styles.emptyWrap}>
          <View
            style={[
              styles.emptyIconWrap,
              { backgroundColor: colors.cardSurface },
            ]}
          >
            <Ionicons
              color={colors.textMuted}
              name="checkmark-done-outline"
              size={18}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            All clear for today
          </Text>
          <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
            No more bookings are scheduled for the rest of today.
          </Text>
        </View>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard style={styles.card}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <View key={item.id} style={styles.row}>
            <View style={styles.railCol}>
              <View style={[styles.dot, { backgroundColor: colors.accent }]} />
              {!isLast ? (
                <View
                  style={[
                    styles.rail,
                    { backgroundColor: colors.borderStrong },
                  ]}
                />
              ) : null}
            </View>
            <View style={styles.content}>
              <Text style={[styles.time, { color: colors.textSecondary }]}>
                {item.time}
              </Text>
              <Text style={[styles.title, { color: colors.text }]}>
                {item.title}
              </Text>
              {item.vehicle ? (
                <Text
                  numberOfLines={1}
                  style={[styles.vehicle, { color: colors.textMuted }]}
                >
                  {item.vehicle}
                </Text>
              ) : null}
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
    flexDirection: "row",
    minHeight: 52,
  },
  railCol: {
    alignItems: "center",
    marginRight: 12,
    width: 14,
  },
  dot: {
    borderRadius: 5,
    height: 10,
    marginTop: 4,
    width: 10,
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
    fontWeight: "600",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  vehicle: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
  },
  empty: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyWrap: {
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  emptyIconWrap: {
    alignItems: "center",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 10,
  },
  emptyBody: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginTop: 4,
    textAlign: "center",
  },
});
