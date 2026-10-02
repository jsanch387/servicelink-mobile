import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CalendarMonthPicker } from '../../../components/ui';
import { parseLocalYyyyMmDd, startOfLocalDay } from '../../../components/ui/calendarDateKey';
import { useTheme } from '../../../theme';
import {
  BOOKINGS_CALENDAR_DAY,
  BOOKINGS_CALENDAR_MONTH,
  BOOKINGS_CALENDAR_WEEK,
  BOOKINGS_LIST_SCREEN_PADDING,
} from '../constants';
import { localYyyyMmDd } from '../../home/utils/bookingStart';
import { BookingsCalendarDayAgenda } from './BookingsCalendarDayAgenda';
import { BookingsCalendarGranularityTabs } from './BookingsCalendarGranularityTabs';
import { BookingsCalendarWeekView } from './BookingsCalendarWeekView';
import { BookingsDayPlanner } from './BookingsDayPlanner';

const CALENDAR_MIN_DATE = new Date(2020, 0, 1);
const CALENDAR_MAX_DATE = new Date(2035, 11, 31);

/**
 * Calendar shell: Day (planner), Week (strip + agenda), Month (picker + agenda).
 */
export function BookingsCalendarView({
  granularity,
  onGranularityChange,
  anchorDate,
  onAnchorDateChange,
  onShiftDay,
  onShiftWeek,
  onVisibleMonthChange,
  bookingCountByDateKey,
  countsLoading,
  countsError,
  dayAgendaBookings,
  dayAgendaLoading,
  dayAgendaError,
  plannerBookings,
  plannerLoading,
  plannerBusinessError,
  plannerDayError,
  plannerHasBusiness,
  onPlannerRefresh,
  onPlannerRetryRefetch,
  plannerRetryLoading = false,
  plannerRefreshing,
  onPlannerBookingPress,
  contentBottomPad,
  safeHorizontalInset,
}) {
  const { isDark } = useTheme();
  const anchorKey = useMemo(() => localYyyyMmDd(anchorDate), [anchorDate]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
        },
        monthScroll: {
          flex: 1,
        },
        monthContent: {
          paddingBottom: contentBottomPad,
          paddingHorizontal: BOOKINGS_LIST_SCREEN_PADDING,
          paddingTop: 4,
        },
        calendarPanel: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.42)',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          borderRadius: 18,
          borderWidth: StyleSheet.hairlineWidth,
          marginTop: 4,
          paddingBottom: 8,
          paddingHorizontal: 8,
          paddingTop: 4,
        },
        plannerWrap: {
          flex: 1,
          paddingLeft: safeHorizontalInset.left,
          paddingRight: safeHorizontalInset.right,
          paddingTop: 8,
        },
      }),
    [contentBottomPad, isDark, safeHorizontalInset.left, safeHorizontalInset.right],
  );

  const onSelectDateKey = (key) => {
    const d = parseLocalYyyyMmDd(key);
    if (d) {
      onAnchorDateChange(startOfLocalDay(d));
    }
  };

  return (
    <View style={styles.root}>
      <BookingsCalendarGranularityTabs onChange={onGranularityChange} value={granularity} />

      {granularity === BOOKINGS_CALENDAR_MONTH ? (
        <ScrollView
          contentContainerStyle={styles.monthContent}
          showsVerticalScrollIndicator={false}
          style={styles.monthScroll}
        >
          <View style={styles.calendarPanel}>
            <CalendarMonthPicker
              bookingCountByDateKey={bookingCountByDateKey}
              maxDate={CALENDAR_MAX_DATE}
              minDate={CALENDAR_MIN_DATE}
              plainNav
              selectedDateKey={anchorKey}
              onSelectDateKey={onSelectDateKey}
              onVisibleMonthChange={onVisibleMonthChange}
            />
          </View>
          <BookingsCalendarDayAgenda
            bookings={dayAgendaBookings}
            dateKey={anchorKey}
            error={dayAgendaError}
            isLoading={dayAgendaLoading}
            onBookingPress={onPlannerBookingPress}
          />
        </ScrollView>
      ) : null}

      {granularity === BOOKINGS_CALENDAR_WEEK ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: contentBottomPad }}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          <BookingsCalendarWeekView
            anchorDate={anchorDate}
            bookingCountByDateKey={bookingCountByDateKey}
            dayAgendaBookings={dayAgendaBookings}
            dayAgendaError={dayAgendaError}
            dayAgendaLoading={dayAgendaLoading}
            onBookingPress={onPlannerBookingPress}
            onSelectDay={onAnchorDateChange}
            onShiftWeek={onShiftWeek}
          />
        </ScrollView>
      ) : null}

      {granularity === BOOKINGS_CALENDAR_DAY ? (
        <View style={styles.plannerWrap}>
          <BookingsDayPlanner
            bookings={plannerBookings}
            businessError={plannerBusinessError}
            dayError={plannerDayError}
            hasBusiness={plannerHasBusiness}
            isLoading={plannerLoading}
            onBookingPress={onPlannerBookingPress}
            onRefresh={onPlannerRefresh}
            onRetryRefetch={onPlannerRetryRefetch}
            onShiftDay={onShiftDay}
            plannerDate={anchorDate}
            refreshing={plannerRefreshing}
            retryLoading={plannerRetryLoading}
          />
        </View>
      ) : null}
    </View>
  );
}
