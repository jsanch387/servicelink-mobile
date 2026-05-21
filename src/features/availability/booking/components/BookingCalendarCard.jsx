import { StyleSheet } from 'react-native';
import { CalendarMonthPicker, SurfaceCard } from '../../../../components/ui';

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
});

/**
 * Month calendar inside the same elevated card used in Create appointment → Schedule.
 * Forwards all {@link CalendarMonthPicker} props (e.g. `bookingCountByDateKey` on owner bookings).
 *
 * @param {{ cardStyle?: object }} props
 */
export function BookingCalendarCard({ cardStyle, ...calendarProps }) {
  return (
    <SurfaceCard style={[styles.card, cardStyle]}>
      <CalendarMonthPicker {...calendarProps} />
    </SurfaceCard>
  );
}
