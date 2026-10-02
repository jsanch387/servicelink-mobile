import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, InlineCardError, SurfaceCard } from '../../../components/ui';
import { parseLocalYyyyMmDd } from '../../../components/ui/calendarDateKey';
import { useTheme } from '../../../theme';
import { BookingCard } from './BookingCard';
import { BookingCardSkeleton } from './BookingCardSkeleton';

/**
 * @param {string} dateKey `YYYY-MM-DD`
 */
function formatAgendaDateLabel(dateKey) {
  const d = parseLocalYyyyMmDd(dateKey);
  if (!d) return '';
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Selected-day appointments below the calendar grid (loaded on demand for that day).
 */
export function BookingsCalendarDayAgenda({
  dateKey,
  bookings = [],
  isLoading = false,
  error = null,
  onBookingPress,
}) {
  const { colors } = useTheme();
  const dateLabel = useMemo(() => formatAgendaDateLabel(dateKey), [dateKey]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginTop: 22,
        },
        headerRow: {
          alignItems: 'baseline',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 16,
        },
        dateLabel: {
          color: colors.text,
          flex: 1,
          fontSize: 16,
          fontWeight: '700',
          letterSpacing: -0.2,
        },
        list: {
          gap: 12,
        },
        errorCard: {
          marginTop: 4,
        },
      }),
    [colors],
  );

  if (error) {
    return (
      <View style={styles.wrap}>
        <SurfaceCard style={styles.errorCard}>
          <InlineCardError message={error} />
        </SurfaceCard>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.wrap}>
        <View style={styles.headerRow}>
          <AppText accessibilityRole="header" style={styles.dateLabel}>
            {dateLabel}
          </AppText>
        </View>
        <BookingCardSkeleton count={2} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <AppText accessibilityRole="header" style={styles.dateLabel}>
          {dateLabel}
        </AppText>
      </View>
      {bookings.length > 0 ? (
        <View style={styles.list}>
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              showRelativeLine={false}
              variant="underDateHeader"
              onPress={() => onBookingPress?.(booking)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
