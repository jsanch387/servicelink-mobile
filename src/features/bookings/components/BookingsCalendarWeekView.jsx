import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  AppointmentCountMarkers,
  PeriodNav,
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
  const [pillsReady, setPillsReady] = useState(false);
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
        weekPanel: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.42)',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          borderRadius: 18,
          borderWidth: StyleSheet.hairlineWidth,
          paddingBottom: 8,
          paddingHorizontal: 8,
          paddingTop: 4,
        },
        divider: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          height: StyleSheet.hairlineWidth,
          marginBottom: 16,
          marginHorizontal: 7,
          marginTop: 4,
        },
        strip: {
          flexDirection: 'row',
        },
        dayCol: {
          alignItems: 'center',
          flex: 1,
        },
        weekday: {
          color: isDark ? 'rgba(250,250,250,0.78)' : colors.textSecondary,
          fontSize: 12,
          fontWeight: '700',
          marginBottom: 10,
        },
        dayPill: {
          alignItems: 'center',
          alignSelf: 'stretch',
          backgroundColor: 'transparent',
          borderRadius: 14,
          height: 52,
          justifyContent: 'center',
          marginHorizontal: 2,
          overflow: 'hidden',
        },
        dayFill: {
          borderRadius: 14,
          bottom: 0,
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        },
        dayFillSelected: {
          backgroundColor: colors.buttonPrimaryBg,
          borderRadius: 14,
          bottom: 0,
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        },
        dayNum: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
        },
        dayNumSelected: {
          color: colors.buttonPrimaryText,
        },
        markerWrap: {
          marginTop: 2,
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.root}>
      <View style={styles.weekPanel}>
        <PeriodNav
          appearance="plain"
          label={rangeLabel}
          nextLabel="Next week"
          previousLabel="Previous week"
          onNext={() => onShiftWeek(1)}
          onPrevious={() => onShiftWeek(-1)}
        />
        <View style={styles.divider} />
        <View
          style={styles.strip}
          onLayout={() => {
            if (!pillsReady) setPillsReady(true);
          }}
        >
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
                <View key={pillsReady ? `${key}-ready` : key} style={styles.dayPill}>
                  {fillOpacity > 0 ? (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.dayFill,
                        { backgroundColor: `${busyFillColor}${fillOpacity})` },
                      ]}
                    />
                  ) : null}
                  {selected ? <View pointerEvents="none" style={styles.dayFillSelected} /> : null}
                  <AppText style={[styles.dayNum, selected && styles.dayNumSelected]}>
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
