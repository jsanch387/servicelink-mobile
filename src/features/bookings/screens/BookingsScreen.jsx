import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  InlineCardError,
  SkeletonBox,
  SurfaceCard,
} from "../../../components/ui";
import { useTheme } from "../../../theme";
import { localYyyyMmDd } from "../../home/utils/bookingStart";
import { BookingCard } from "../components/BookingCard";
import { BookingsDayPlanner } from "../components/BookingsDayPlanner";
import { BookingsListTabs } from "../components/BookingsListTabs";
import { BookingsViewModeToggle } from "../components/BookingsViewModeToggle";
import {
  BOOKINGS_FILTER_CANCELLED,
  BOOKINGS_FILTER_PAST,
  BOOKINGS_FILTER_UPCOMING,
  BOOKINGS_LIST_SCREEN_PADDING,
  BOOKINGS_VIEW_LIST,
  BOOKINGS_VIEW_PLANNER,
} from "../constants";
import { useBookingsList } from "../hooks/useBookingsList";
import { useBookingsPlannerDay } from "../hooks/useBookingsPlannerDay";
import { groupBookingsByScheduledDate } from "../utils/groupBookingsByDate";
import { ROUTES } from "../../../routes/routes";

const FAB_VERTICAL_GAP = 56;

function BookingsListSkeleton() {
  return (
    <View style={skeletonStyles.skeletonColumn}>
      {[0, 1, 2].map((k) => (
        <SurfaceCard key={k} style={skeletonStyles.skeletonCard}>
          <SkeletonBox borderRadius={8} height={18} width="72%" />
          <SkeletonBox
            borderRadius={8}
            height={14}
            style={{ marginTop: 14 }}
            width="50%"
          />
          <SkeletonBox
            borderRadius={8}
            height={14}
            style={{ marginTop: 10 }}
            width="40%"
          />
        </SurfaceCard>
      ))}
    </View>
  );
}

export function BookingsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const bottomPad = 28 + Math.max(tabBarHeight, 72) + FAB_VERTICAL_GAP;

  const [viewMode, setViewMode] = useState(BOOKINGS_VIEW_LIST);
  const [plannerDate, setPlannerDate] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);

  const list = useBookingsList({
    listEnabled: viewMode === BOOKINGS_VIEW_LIST,
  });
  const plannerDateStr = useMemo(
    () => localYyyyMmDd(plannerDate),
    [plannerDate],
  );
  const planner = useBookingsPlannerDay(
    viewMode === BOOKINGS_VIEW_PLANNER ? plannerDateStr : null,
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (viewMode === BOOKINGS_VIEW_LIST) {
        await list.refetch();
      } else {
        await planner.refetch();
      }
    } finally {
      setRefreshing(false);
    }
  }, [viewMode, list.refetch, planner.refetch]);

  const shiftPlannerDay = useCallback((delta) => {
    setPlannerDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + delta);
      return n;
    });
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        fabWrap: {
          ...StyleSheet.absoluteFillObject,
          alignItems: "center",
          justifyContent: "flex-end",
          /** Hug the bottom tab bar — small gap only (tab bar sits below this screen). */
          paddingBottom: Math.max(insets.bottom, 6) + 6,
        },
        /** Ensures the toggle receives taps above the list/planner scroll surface. */
        fabHit: {
          alignSelf: "center",
          elevation: 24,
          position: "relative",
          zIndex: 24,
        },
        syncHint: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 8,
          textAlign: "center",
        },
        listContent: {
          flexGrow: 1,
          paddingBottom: bottomPad,
          paddingHorizontal: BOOKINGS_LIST_SCREEN_PADDING,
          paddingTop: 18,
        },
        plannerContent: {
          flex: 1,
          /** Safe area only — day planner uses full width (times + grid). */
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingTop: 18,
        },
        sectionHeader: {
          backgroundColor: colors.shell,
          marginBottom: 10,
          paddingTop: 18,
        },
        sectionHeaderFirst: {
          paddingTop: 2,
        },
        sectionHeaderText: {
          color: colors.textMuted,
          fontSize: 16,
          fontWeight: "500",
          letterSpacing: -0.2,
        },
        emptyWrap: {
          alignItems: "center",
          alignSelf: "stretch",
          marginTop: 32,
          paddingHorizontal: 0,
        },
        emptyTitle: {
          color: colors.textSecondary,
          fontSize: 17,
          fontWeight: "700",
          textAlign: "center",
        },
        emptyBody: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: "500",
          lineHeight: 21,
          marginTop: 8,
          textAlign: "center",
        },
        errorBlock: {
          marginBottom: 12,
        },
      }),
    [colors, bottomPad, insets.bottom, insets.left, insets.right],
  );

  const showSyncHint =
    viewMode === BOOKINGS_VIEW_LIST && list.isFetching && !list.isLoading;
  const scheduleError = list.businessError || list.listError;
  const showRelativeLine = list.listFilter === BOOKINGS_FILTER_UPCOMING;

  const sections = useMemo(
    () => groupBookingsByScheduledDate(list.bookings),
    [list.bookings],
  );

  const renderSectionHeader = useCallback(
    ({ section }) => {
      const isFirst = section.index === 0;
      return (
        <View
          style={[styles.sectionHeader, isFirst && styles.sectionHeaderFirst]}
          accessibilityRole="header"
        >
          <Text style={styles.sectionHeaderText}>{section.title}</Text>
        </View>
      );
    },
    [styles.sectionHeader, styles.sectionHeaderFirst, styles.sectionHeaderText],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <BookingCard
        booking={item}
        onPress={() =>
          navigation.navigate(ROUTES.BOOKING_DETAILS, { bookingId: item.id })
        }
        showRelativeLine={showRelativeLine}
        variant="underDateHeader"
      />
    ),
    [navigation, showRelativeLine],
  );

  const sectionsWithIndex = useMemo(
    () => sections.map((s, index) => ({ ...s, index })),
    [sections],
  );

  const listHeader = useMemo(
    () => (
      <View>
        {showSyncHint ? <Text style={styles.syncHint}>Updating…</Text> : null}
        {list.businessError ? (
          <View style={styles.errorBlock}>
            <SurfaceCard>
              <InlineCardError message={list.businessError} />
            </SurfaceCard>
          </View>
        ) : null}
        {list.business?.id && list.listError ? (
          <View style={styles.errorBlock}>
            <SurfaceCard>
              <InlineCardError message={list.listError} />
            </SurfaceCard>
          </View>
        ) : null}
      </View>
    ),
    [
      list.business?.id,
      list.businessError,
      list.listError,
      showSyncHint,
      styles.errorBlock,
      styles.syncHint,
    ],
  );

  const listEmpty = useMemo(() => {
    if (list.isLoading) {
      return null;
    }
    if (scheduleError) {
      return null;
    }
    if (!list.business?.id) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No business profile</Text>
          <Text style={styles.emptyBody}>
            Once your business is set up in ServiceLink, appointments will show
            here.
          </Text>
        </View>
      );
    }
    if (list.listFilter === BOOKINGS_FILTER_UPCOMING) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No upcoming appointments</Text>
          <Text style={styles.emptyBody}>
            Confirmed visits from today onward that have not started yet show
            here, soonest first.
          </Text>
        </View>
      );
    }
    if (list.listFilter === BOOKINGS_FILTER_PAST) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No past appointments</Text>
          <Text style={styles.emptyBody}>
            Confirmed or completed visits that already ended show here (up to
            the last 250 prior days loaded, plus today).
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>No cancelled appointments</Text>
        <Text style={styles.emptyBody}>
          Cancelled bookings (status cancelled or canceled) appear here, most
          recent first.
        </Text>
      </View>
    );
  }, [
    list.business?.id,
    list.isLoading,
    list.listFilter,
    scheduleError,
    styles.emptyBody,
    styles.emptyTitle,
    styles.emptyWrap,
  ]);

  return (
    <SafeAreaView edges={["top"]} style={styles.root}>
      {viewMode === BOOKINGS_VIEW_LIST ? (
        <BookingsListTabs
          onChange={list.setListFilter}
          value={list.listFilter}
        />
      ) : null}

      {viewMode === BOOKINGS_VIEW_LIST ? (
        list.isLoading ? (
          <View style={{ paddingHorizontal: BOOKINGS_LIST_SCREEN_PADDING }}>
            <BookingsListSkeleton />
          </View>
        ) : (
          <SectionList
            ListEmptyComponent={listEmpty}
            ListHeaderComponent={listHeader}
            contentContainerStyle={styles.listContent}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                colors={[colors.accent]}
                onRefresh={onRefresh}
                refreshing={refreshing}
                tintColor={colors.accent}
              />
            }
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            sections={sectionsWithIndex}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled
          />
        )
      ) : (
        <View style={styles.plannerContent}>
          <BookingsDayPlanner
            bookings={planner.bookings}
            businessError={planner.businessError}
            dayError={planner.dayError}
            hasBusiness={Boolean(planner.business?.id)}
            isLoading={planner.isLoading}
            onRefresh={onRefresh}
            onShiftDay={shiftPlannerDay}
            plannerDate={plannerDate}
            refreshing={refreshing}
          />
        </View>
      )}

      <View pointerEvents="box-none" style={styles.fabWrap}>
        <View pointerEvents="auto" style={styles.fabHit}>
          <BookingsViewModeToggle mode={viewMode} onChange={setViewMode} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const skeletonStyles = StyleSheet.create({
  skeletonColumn: {
    gap: 12,
    marginTop: 18,
  },
  skeletonCard: {
    marginBottom: 0,
  },
});
