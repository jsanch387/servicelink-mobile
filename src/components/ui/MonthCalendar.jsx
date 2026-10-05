import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { CalendarMonthPicker } from './CalendarMonthPicker';

/**
 * Month calendar in the same panel as Bookings → Calendar → Month.
 * Pass `bookingCountByDateKey` only when the days should show appointment counts.
 *
 * @param {object} props
 * @param {string | null} [props.selectedDateKey]
 * @param {(isoLocalYyyyMmDd: string) => void} props.onSelectDateKey
 * @param {Date} [props.minDate]
 * @param {Date} [props.maxDate]
 * @param {Record<string, number>} [props.bookingCountByDateKey]
 * @param {(monthStart: Date) => void} [props.onVisibleMonthChange]
 * @param {object} [props.style]
 */
export function MonthCalendar({
  selectedDateKey = null,
  onSelectDateKey,
  minDate,
  maxDate,
  bookingCountByDateKey,
  onVisibleMonthChange,
  style,
}) {
  const { isDark } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        panel: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.42)',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          borderRadius: 18,
          borderWidth: StyleSheet.hairlineWidth,
          paddingBottom: 8,
          paddingHorizontal: 8,
          paddingTop: 4,
        },
      }),
    [isDark],
  );

  return (
    <View style={[styles.panel, style]}>
      <CalendarMonthPicker
        appearance="owner"
        bookingCountByDateKey={bookingCountByDateKey}
        maxDate={maxDate}
        minDate={minDate}
        plainNav
        selectedDateKey={selectedDateKey || null}
        onSelectDateKey={onSelectDateKey}
        onVisibleMonthChange={onVisibleMonthChange}
      />
    </View>
  );
}
