import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  AppointmentCountMarkers,
  appointmentDayFillOpacity,
} from '../../../components/ui';
import { toLocalYyyyMmDd } from '../../../components/ui/calendarDateKey';
import { useTheme } from '../../../theme';
import { BOOKINGS_LIST_SCREEN_PADDING } from '../constants';
import { localYyyyMmDd } from '../../home/utils/bookingStart';
import { weekDaysFromAnchor } from '../utils/calendarRange';
import { BookingsCalendarDayAgenda } from './BookingsCalendarDayAgenda';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * @param {Date[]} days
 */
function formatWeekRangeLabel(days) {
  const first = days[0];
  const last = days[6];
  const sameMonth = first.getMonth() === last.getMonth();
  const sameYear = first.getFullYear() === last.getFullYear();
  const startPart = first.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const endPart = last.toLocaleDateString(undefined, {
    month: sameMonth ? undefined : 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  });
  if (sameMonth && sameYear) {
    return `${startPart} – ${last.getDate()}, ${last.getFullYear()}`;
  }
  return `${startPart} – ${endPart}`;
}

export function BookingsCalendarWeekView({
  anchorDate,
  onShiftWeek,
  onSelectDay,
  bookingCountByDateKey,
  dayAgendaBookings,
  dayAgendaLoading = false,
  dayAgendaError = null,
  onBookingPress,
}) {
  const { colors, isDark } = useTheme();
  const busyFillColor = isDark ? 'rgba(250,250,250,' : 'rgba(10,10,10,';
  const todayKey = useMemo(() => localYyyyMmDd(new Date()), []);
  const selectedKey = useMemo(() => localYyyyMmDd(anchorDate), [anchorDate]);
  const weekDays = useMemo(() => weekDaysFromAnchor(anchorDate), [anchorDate]);
  const rangeLabel = useMemo(() => formatWeekRangeLabel(weekDays), [weekDays]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          paddingHorizontal: BOOKINGS_LIST_SCREEN_PADDING,
          paddingTop: 4,
        },
        navRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 6,
        },
        navHit: {
          alignItems: 'center',
          borderRadius: 12,
          height: 40,
          justifyContent: 'center',
          width: 40,
        },
        rangeTitle: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '700',
          letterSpacing: -0.2,
          textAlign: 'center',
        },
        strip: {
          flexDirection: 'row',
          marginBottom: 4,
          marginTop: 4,
        },
        dayCol: {
          alignItems: 'center',
          flex: 1,
        },
        weekday: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 6,
        },
        dayPill: {
          alignItems: 'center',
          borderRadius: 10,
          justifyContent: 'center',
          minHeight: 44,
          minWidth: 36,
          paddingBottom: 6,
          paddingHorizontal: 4,
          paddingTop: 4,
        },
        dayPillSelected: {
          backgroundColor: colors.buttonPrimaryBg,
        },
        dayPillToday: {
          borderColor: colors.tabBarActive,
          borderWidth: 1.5,
        },
        dayNum: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '700',
        },
        dayNumSelected: {
          color: colors.buttonPrimaryText,
        },
        dayNumIdle: {
          color: colors.textMuted,
          fontWeight: '600',
        },
        markerWrap: {
          marginTop: 2,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <View style={styles.navRow}>
        <Pressable
          accessibilityLabel="Previous week"
          accessibilityRole="button"
          hitSlop={8}
          style={styles.navHit}
          onPress={() => onShiftWeek(-1)}
        >
          <Ionicons color={colors.text} name="chevron-back" size={22} />
        </Pressable>
        <AppText style={styles.rangeTitle}>{rangeLabel}</AppText>
        <Pressable
          accessibilityLabel="Next week"
          accessibilityRole="button"
          hitSlop={8}
          style={styles.navHit}
          onPress={() => onShiftWeek(1)}
        >
          <Ionicons color={colors.text} name="chevron-forward" size={22} />
        </Pressable>
      </View>

      <View style={styles.strip}>
        {weekDays.map((day, index) => {
          const key = toLocalYyyyMmDd(day);
          const selected = key === selectedKey;
          const isToday = key === todayKey;
          const bookingCount = bookingCountByDateKey[key] ?? 0;
          const hasBookings = bookingCount > 0;
          const fillOpacity =
            hasBookings && !selected ? appointmentDayFillOpacity(bookingCount) : 0;
          return (
            <Pressable
              key={key}
              accessibilityLabel={`${WEEKDAY_LABELS[index]} ${day.getDate()}${isToday ? ', today' : ''}${selected ? ', selected' : ''}${hasBookings ? `, ${bookingCount} appointment${bookingCount === 1 ? '' : 's'}` : ''}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={styles.dayCol}
              onPress={() => onSelectDay(day)}
            >
              <AppText style={styles.weekday}>{WEEKDAY_LABELS[index]}</AppText>
              <View
                style={[
                  styles.dayPill,
                  fillOpacity > 0 ? { backgroundColor: `${busyFillColor}${fillOpacity})` } : null,
                  selected && styles.dayPillSelected,
                  isToday && !selected && styles.dayPillToday,
                ]}
              >
                <AppText
                  style={[
                    styles.dayNum,
                    selected && styles.dayNumSelected,
                    !selected && !isToday && styles.dayNumIdle,
                  ]}
                >
                  {day.getDate()}
                </AppText>
                {hasBookings ? (
                  <View style={styles.markerWrap}>
                    <AppointmentCountMarkers compact count={bookingCount} inverted={selected} />
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <BookingsCalendarDayAgenda
        bookings={dayAgendaBookings}
        dateKey={selectedKey}
        error={dayAgendaError}
        isLoading={dayAgendaLoading}
        onBookingPress={onBookingPress}
      />
    </View>
  );
}
