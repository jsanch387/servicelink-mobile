import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, InlineCardError, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { localYyyyMmDd } from '../../home/utils/bookingStart';
import { BookingCard } from '../components/BookingCard';
import { BookingCardSkeleton } from '../components/BookingCardSkeleton';
import { BookingsCalendarView } from '../components/BookingsCalendarView';
import { BookingsFreeTierUsageStrip } from '../components/BookingsFreeTierUsageStrip';
import { BookingsListTabs } from '../components/BookingsListTabs';
import { BookingsViewModeToggle } from '../components/BookingsViewModeToggle';
import {
  BOOKINGS_CALENDAR_DAY,
  BOOKINGS_CALENDAR_MONTH,
  BOOKINGS_CALENDAR_WEEK,
  BOOKINGS_DEFAULT_CALENDAR_GRANULARITY,
  BOOKINGS_DEFAULT_VIEW_MODE,
  BOOKINGS_FILTER_PAST,
  BOOKINGS_FILTER_UPCOMING,
  BOOKINGS_LIST_SCREEN_PADDING,
  BOOKINGS_VIEW_CALENDAR,
  BOOKINGS_VIEW_LIST,
} from '../constants';
import { useBookingsCalendarCounts } from '../hooks/useBookingsCalendarCounts';
import { useBookingsFreeTierUsage } from '../hooks/useBookingsFreeTierUsage';
import { useBookingsList } from '../hooks/useBookingsList';
import { useBookingsPlannerDay } from '../hooks/useBookingsPlannerDay';
import { getMonthDateRangeKeys, getWeekDateRangeKeys } from '../utils/calendarRange';
import { groupBookingsByScheduledDate } from '../utils/groupBookingsByDate';
import { resolveFreeTierBookingUsed } from '../utils/resolveFreeTierBookingUsed';
import { ROUTES } from '../../../routes/routes';
import { useSubscription } from '../../subscription';

const FAB_VERTICAL_GAP = 56;

function BookingsListSkeleton() {
  return (
    <View style={skeletonStyles.skeletonColumn}>
      <BookingCardSkeleton count={3} />
    </View>
  );
}

export function BookingsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const bottomPad = 28 + Math.max(tabBarHeight, 72) + FAB_VERTICAL_GAP;

  const [viewMode, setViewMode] = useState(BOOKINGS_DEFAULT_VIEW_MODE);
  const [calendarGranularity, setCalendarGranularity] = useState(
    BOOKINGS_DEFAULT_CALENDAR_GRANULARITY,
  );
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [visibleMonthStart, setVisibleMonthStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [refreshing, setRefreshing] = useState(false);

  const list = useBookingsList({
    listEnabled: viewMode === BOOKINGS_VIEW_LIST,
  });
  const { hasProAccess, isOwnerProfileLoaded } = useSubscription();
  const showFreeTierUsage =
    isOwnerProfileLoaded && !hasProAccess && Boolean(list.business?.id) && !list.businessError;

  const freeTierUsage = useBookingsFreeTierUsage(list.business?.id, {
    enabled: showFreeTierUsage,
  });

  const resolvedFreeBookingUsed = useMemo(
    () => resolveFreeTierBookingUsed(list.business, freeTierUsage.used),
    [list.business, freeTierUsage.used],
  );

  const hasProfileFreeBookingCount = useMemo(() => {
    const v = list.business?.free_bookings_count;
    return typeof v === 'number' && Number.isFinite(v);
  }, [list.business?.free_bookings_count]);

  const freeTierUsageStripLoading =
    freeTierUsage.isLoading && typeof resolvedFreeBookingUsed !== 'number';
  const freeTierUsageStripError = freeTierUsage.isError && !hasProfileFreeBookingCount;

  const anchorDateStr = useMemo(() => localYyyyMmDd(anchorDate), [anchorDate]);
  const calendarMode = viewMode === BOOKINGS_VIEW_CALENDAR;
  const calendarDayTab = calendarMode && calendarGranularity === BOOKINGS_CALENDAR_DAY;
  const calendarAgendaEnabled =
    calendarMode &&
    (calendarGranularity === BOOKINGS_CALENDAR_MONTH ||
      calendarGranularity === BOOKINGS_CALENDAR_WEEK);

  const calendarDay = useBookingsPlannerDay(
    calendarAgendaEnabled || calendarDayTab ? anchorDateStr : null,
  );

  const calendarRangeKeys = useMemo(() => {
    if (viewMode !== BOOKINGS_VIEW_CALENDAR) {
      return null;
    }
    if (calendarGranularity === BOOKINGS_CALENDAR_MONTH) {
      return getMonthDateRangeKeys(visibleMonthStart);
    }
    if (calendarGranularity === BOOKINGS_CALENDAR_WEEK) {
      return getWeekDateRangeKeys(anchorDate);
    }
    return null;
  }, [viewMode, calendarGranularity, visibleMonthStart, anchorDate]);

  const calendarCountsEnabled =
    calendarMode &&
    (calendarGranularity === BOOKINGS_CALENDAR_MONTH ||
      calendarGranularity === BOOKINGS_CALENDAR_WEEK);

  const calendarCounts = useBookingsCalendarCounts({
    rangeStart: calendarRangeKeys?.start,
    rangeEnd: calendarRangeKeys?.end,
    enabled: calendarCountsEnabled,
  });

  const calendarDayError =
    calendarCounts.businessError || calendarDay.businessError || calendarDay.dayError;
  const calendarCountsError = calendarCounts.businessError || calendarCounts.countsError;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (viewMode === BOOKINGS_VIEW_LIST) {
        await list.refetch();
      } else if (calendarMode) {
        await Promise.all([calendarCounts.refetch(), calendarDay.refetch()]);
      }
    } finally {
      setRefreshing(false);
    }
  }, [viewMode, calendarMode, list, calendarCounts, calendarDay]);

  const shiftAnchorDay = useCallback((delta) => {
    setAnchorDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + delta);
      return n;
    });
  }, []);

  const shiftAnchorWeek = useCallback((deltaWeeks) => {
    setAnchorDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + deltaWeeks * 7);
      return n;
    });
  }, []);

  const onPlannerBookingPress = useCallback(
    (booking) => {
      if (booking?.id) {
        navigation.navigate(ROUTES.BOOKING_DETAILS, { bookingId: booking.id });
      }
    },
    [navigation],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        fabWrap: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'flex-end',
          /** Hug the bottom tab bar — small gap only (tab bar sits below this screen). */
          paddingBottom: Math.max(insets.bottom, 6) + 6,
        },
        /** Ensures the toggle receives taps above the list/planner scroll surface. */
        fabHit: {
          alignSelf: 'center',
          elevation: 24,
          position: 'relative',
          zIndex: 24,
        },
        errorRetry: {
          marginTop: 12,
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
          paddingTop: 12,
        },
        usageStripWrap: {
          paddingBottom: 8,
          paddingHorizontal: BOOKINGS_LIST_SCREEN_PADDING,
          paddingTop: 10,
        },
        sectionHeader: {
          /** No solid shell fill — avoids a heavy bar behind sticky date labels. */
          marginBottom: 10,
          paddingTop: 18,
        },
        sectionHeaderFirst: {
          paddingTop: 2,
        },
        sectionHeaderText: {
          color: colors.textSecondary,
          fontSize: 16,
          fontWeight: '500',
          letterSpacing: -0.2,
        },
        emptyWrap: {
          alignItems: 'center',
          alignSelf: 'stretch',
          marginTop: 32,
          paddingHorizontal: 0,
        },
        emptyTitle: {
          color: colors.textSecondary,
          fontSize: 17,
          fontWeight: '700',
          textAlign: 'center',
        },
        emptyBody: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 21,
          marginTop: 8,
          textAlign: 'center',
        },
        errorBlock: {
          marginBottom: 12,
        },
        loadMoreWrap: {
          alignItems: 'center',
          marginTop: 16,
          paddingBottom: 12,
        },
        loadMoreLink: {
          color: colors.link,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.1,
          textAlign: 'center',
          textDecorationLine: 'underline',
        },
        loadMoreLinkDisabled: {
          opacity: 0.5,
        },
      }),
    [colors, bottomPad, insets.bottom, insets.left, insets.right],
  );

  const scheduleError = list.businessError || list.listError;
  const showRelativeLine = list.listFilter === BOOKINGS_FILTER_UPCOMING;

  const sections = useMemo(() => groupBookingsByScheduledDate(list.bookings), [list.bookings]);

  const renderSectionHeader = useCallback(
    ({ section }) => {
      const isFirst = section.index === 0;
      return (
        <View
          style={[styles.sectionHeader, isFirst && styles.sectionHeaderFirst]}
          accessibilityRole="header"
        >
          <AppText style={styles.sectionHeaderText}>{section.title}</AppText>
        </View>
      );
    },
    [styles.sectionHeader, styles.sectionHeaderFirst, styles.sectionHeaderText],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <BookingCard
        booking={item}
        onPress={() => navigation.navigate(ROUTES.BOOKING_DETAILS, { bookingId: item.id })}
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

  const listFooter = useMemo(() => {
    if (list.isLoading || scheduleError || !list.business?.id) {
      return null;
    }
    if (!list.hasNextPage) {
      return null;
    }
    return (
      <View style={styles.loadMoreWrap}>
        <Pressable
          accessibilityHint="Loads appointments from an earlier month"
          accessibilityLabel={list.loadMoreLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: list.isFetchingNextPage }}
          disabled={list.isFetchingNextPage}
          hitSlop={8}
          onPress={list.loadMore}
        >
          <AppText
            style={[styles.loadMoreLink, list.isFetchingNextPage && styles.loadMoreLinkDisabled]}
          >
            {list.isFetchingNextPage ? 'Loading…' : list.loadMoreLabel}
          </AppText>
        </Pressable>
      </View>
    );
  }, [list, scheduleError, styles.loadMoreLink, styles.loadMoreLinkDisabled, styles.loadMoreWrap]);

  const listHeader = useMemo(
    () => (
      <View>
        {list.businessError ? (
          <View style={styles.errorBlock}>
            <SurfaceCard>
              <InlineCardError message={list.businessError} />
              <Button
                accessibilityHint="Attempts to load bookings again"
                accessibilityLabel="Try again"
                fullWidth
                loading={list.isFetching && !list.isLoading}
                style={styles.errorRetry}
                title="Try again"
                variant="secondary"
                onPress={() => void list.refetch()}
              />
            </SurfaceCard>
          </View>
        ) : null}
        {list.business?.id && list.listError ? (
          <View style={styles.errorBlock}>
            <SurfaceCard>
              <InlineCardError message={list.listError} />
              <Button
                accessibilityHint="Attempts to load bookings again"
                accessibilityLabel="Try again"
                fullWidth
                loading={list.isFetching && !list.isLoading}
                style={styles.errorRetry}
                title="Try again"
                variant="secondary"
                onPress={() => void list.refetch()}
              />
            </SurfaceCard>
          </View>
        ) : null}
      </View>
    ),
    [list, styles.errorBlock, styles.errorRetry],
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
          <AppText style={styles.emptyTitle}>No business profile</AppText>
          <AppText style={styles.emptyBody}>
            Once your business is set up in ServiceLink, appointments will show here.
          </AppText>
        </View>
      );
    }
    if (list.listFilter === BOOKINGS_FILTER_UPCOMING) {
      return (
        <View style={styles.emptyWrap}>
          <AppText style={styles.emptyTitle}>No upcoming appointments</AppText>
          <AppText style={styles.emptyBody}>
            Confirmed visits from today onward that have not started yet show here, soonest first.
          </AppText>
        </View>
      );
    }
    if (list.listFilter === BOOKINGS_FILTER_PAST) {
      return (
        <View style={styles.emptyWrap}>
          <AppText style={styles.emptyTitle}>No past appointments</AppText>
          <AppText style={styles.emptyBody}>
            Confirmed or completed appointments that ended before the current date and time show
            here.
          </AppText>
        </View>
      );
    }
    return (
      <View style={styles.emptyWrap}>
        <AppText style={styles.emptyTitle}>No canceled appointments</AppText>
        <AppText style={styles.emptyBody}>
          Canceled appointments appear here, most recent first.
        </AppText>
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

  const freeTierUsageStrip = useMemo(() => {
    if (!showFreeTierUsage) {
      return null;
    }
    return (
      <View style={styles.usageStripWrap}>
        <BookingsFreeTierUsageStrip
          error={freeTierUsageStripError}
          limit={freeTierUsage.limit}
          loading={freeTierUsageStripLoading}
          used={resolvedFreeBookingUsed}
        />
      </View>
    );
  }, [
    showFreeTierUsage,
    styles.usageStripWrap,
    freeTierUsage.limit,
    freeTierUsageStripError,
    freeTierUsageStripLoading,
    resolvedFreeBookingUsed,
  ]);

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      {viewMode === BOOKINGS_VIEW_LIST ? (
        <BookingsListTabs onChange={list.setListFilter} value={list.listFilter} />
      ) : null}

      {freeTierUsageStrip}

      {viewMode === BOOKINGS_VIEW_LIST ? (
        list.isLoading ? (
          <View style={{ paddingHorizontal: BOOKINGS_LIST_SCREEN_PADDING }}>
            <BookingsListSkeleton />
          </View>
        ) : (
          <SectionList
            ListEmptyComponent={listEmpty}
            ListFooterComponent={listFooter}
            ListHeaderComponent={listHeader}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                colors={[colors.accent]}
                onRefresh={onRefresh}
                refreshing={refreshing}
                tintColor={colors.accent}
              />
            }
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            sections={sectionsWithIndex}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled
          />
        )
      ) : (
        <View style={styles.plannerContent}>
          <BookingsCalendarView
            anchorDate={anchorDate}
            bookingCountByDateKey={calendarCounts.bookingCountByDateKey}
            contentBottomPad={bottomPad}
            countsError={calendarCountsError}
            countsLoading={calendarCounts.isLoading}
            dayAgendaBookings={calendarDay.bookings}
            dayAgendaError={calendarDayError}
            dayAgendaLoading={calendarAgendaEnabled && calendarDay.isDayPending}
            granularity={calendarGranularity}
            onAnchorDateChange={setAnchorDate}
            onGranularityChange={setCalendarGranularity}
            onPlannerBookingPress={onPlannerBookingPress}
            onPlannerRefresh={onRefresh}
            onPlannerRetryRefetch={() => void calendarDay.refetch()}
            onShiftDay={shiftAnchorDay}
            onShiftWeek={shiftAnchorWeek}
            onVisibleMonthChange={setVisibleMonthStart}
            plannerBookings={calendarDay.bookings}
            plannerBusinessError={calendarDay.businessError}
            plannerDayError={calendarDay.dayError}
            plannerHasBusiness={Boolean(calendarDay.business?.id)}
            plannerLoading={calendarDay.isLoading}
            plannerRefreshing={refreshing}
            plannerRetryLoading={calendarDay.isFetching && !calendarDay.isLoading}
            safeHorizontalInset={{ left: insets.left, right: insets.right }}
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
    marginTop: 18,
  },
});
