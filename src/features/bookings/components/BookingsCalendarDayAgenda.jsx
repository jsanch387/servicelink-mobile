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

function appointmentCountLabel(count) {
  if (count === 0) return null;
  if (count === 1) return '1 appointment';
  return `${count} appointments`;
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
  const countLabel = useMemo(
    () => (isLoading ? null : appointmentCountLabel(bookings.length)),
    [bookings.length, isLoading],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginTop: 28,
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
        countLabel: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
          marginLeft: 12,
        },
        list: {
          gap: 12,
        },
        emptySlot: {
          alignItems: 'center',
          paddingBottom: 16,
          paddingTop: 40,
        },
        emptyBody: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          textAlign: 'center',
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

  const isEmpty = bookings.length === 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <AppText accessibilityRole="header" style={styles.dateLabel}>
          {dateLabel}
        </AppText>
        {countLabel ? <AppText style={styles.countLabel}>{countLabel}</AppText> : null}
      </View>
      {isEmpty ? (
        <View style={styles.emptySlot}>
          <AppText style={styles.emptyBody}>Nothing scheduled this day.</AppText>
        </View>
      ) : (
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
      )}
    </View>
  );
}
