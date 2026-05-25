import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText, InlineCardError } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { BookingCalendarCard } from './BookingCalendarCard';
import { TimeSlotGrid } from './TimeSlotGrid';

/**
 * Month calendar + time slot grid for owner/public booking flows.
 *
 * @param {{
 *   selectedDateKey: string | null;
 *   selectedTime: string | null;
 *   onSelectDateKey: (k: string) => void;
 *   onSelectTime: (t: string) => void;
 *   timeSlots: string[];
 *   isDateUnavailable?: (d: Date) => boolean;
 *   minDate?: Date;
 *   maxDate?: Date;
 *   scheduleLoading?: boolean;
 *   scheduleError?: string | null;
 *   acceptBookings?: boolean;
 *   availabilityHint?: string;
 * }} props
 */
export function BookingDateTimePicker({
  selectedDateKey,
  selectedTime,
  onSelectDateKey,
  onSelectTime,
  timeSlots,
  isDateUnavailable,
  minDate,
  maxDate,
  scheduleLoading = false,
  scheduleError = null,
  acceptBookings = true,
  availabilityHint = null,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        banner: {
          color: colors.danger,
          fontSize: 14,
          fontWeight: '600',
          lineHeight: 20,
          marginBottom: 12,
        },
        timeLabel: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginBottom: 12,
        },
        hint: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
        },
        availabilityHint: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 21,
          marginBottom: 12,
        },
        errorWrap: {
          marginBottom: 8,
          marginTop: 4,
        },
        loadingRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
          paddingVertical: 8,
        },
        timeBlock: {
          marginTop: 0,
        },
      }),
    [colors],
  );

  return (
    <View>
      {!acceptBookings ? (
        <AppText style={styles.banner}>
          This business is not accepting new bookings right now. You can still review settings in
          Availability.
        </AppText>
      ) : null}

      {availabilityHint ? (
        <AppText style={styles.availabilityHint}>{availabilityHint}</AppText>
      ) : null}

      <BookingCalendarCard
        isDateUnavailable={isDateUnavailable}
        maxDate={maxDate}
        minDate={minDate}
        selectedDateKey={selectedDateKey}
        onSelectDateKey={onSelectDateKey}
      />

      {scheduleError ? (
        <View style={styles.errorWrap}>
          <InlineCardError message={scheduleError} />
        </View>
      ) : null}

      <View style={styles.timeBlock}>
        {selectedDateKey ? (
          <>
            <AppText style={styles.timeLabel}>Choose time</AppText>
            {scheduleLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.accent} />
                <AppText style={styles.hint}>Loading open times…</AppText>
              </View>
            ) : (
              <TimeSlotGrid
                selectedTime={selectedTime}
                timeSlots={timeSlots}
                onSelectTime={onSelectTime}
              />
            )}
          </>
        ) : (
          <AppText style={styles.hint}>Select a date to see open times.</AppText>
        )}
      </View>
    </View>
  );
}
