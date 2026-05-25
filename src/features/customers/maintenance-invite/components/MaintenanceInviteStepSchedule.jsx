import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText, InlineCardError } from '../../../../components/ui';
import { BookingCalendarCard, TimeSlotGrid } from '../../../availability/booking';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { MAINTENANCE_INVITE_SCHEDULE_AVAILABILITY_HINT } from '../constants';

/**
 * @param {object} props
 * @param {ReturnType<import('../hooks/useMaintenanceInviteSchedule').useMaintenanceInviteSchedule>} props.schedule
 */
export function MaintenanceInviteStepSchedule({ schedule }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          gap: 20,
        },
        banner: {
          color: colors.danger,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
          fontWeight: '600',
          lineHeight: 20,
        },
        availabilityNoteRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 6,
          marginTop: -8,
        },
        availabilityNoteIcon: {
          marginTop: 1,
          opacity: 0.85,
        },
        availabilityNote: {
          color: colors.placeholder,
          flex: 1,
          fontSize: 12,
          fontWeight: '400',
          letterSpacing: -0.02,
          lineHeight: 17,
          opacity: 0.9,
        },
        timeSection: {
          gap: 12,
        },
        timeLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
        loadingRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
          paddingVertical: 4,
        },
        loadingText: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      {!schedule.acceptBookings ? (
        <AppText style={styles.banner}>
          Bookings are turned off in Availability. Turn them on to suggest a date and time.
        </AppText>
      ) : null}

      <BookingCalendarCard
        cardStyle={{ marginBottom: 0 }}
        isDateUnavailable={schedule.isDateUnavailable}
        maxDate={schedule.maxDate}
        minDate={schedule.minDate}
        selectedDateKey={schedule.selectedDateKey}
        onSelectDateKey={schedule.onSelectDateKey}
      />

      <View style={styles.availabilityNoteRow}>
        <Ionicons
          color={colors.placeholder}
          name="information-circle-outline"
          size={14}
          style={styles.availabilityNoteIcon}
        />
        <AppText style={styles.availabilityNote}>
          {MAINTENANCE_INVITE_SCHEDULE_AVAILABILITY_HINT}
        </AppText>
      </View>

      {schedule.scheduleError ? <InlineCardError message={schedule.scheduleError} /> : null}

      {schedule.selectedDateKey ? (
        <View style={styles.timeSection}>
          <AppText style={styles.timeLabel}>Choose time</AppText>
          {schedule.scheduleLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.accent} />
              <AppText style={styles.loadingText}>Loading open times…</AppText>
            </View>
          ) : (
            <TimeSlotGrid
              horizontalPadding={0}
              selectedTime={schedule.selectedTime}
              timeSlots={schedule.timeSlots}
              onSelectTime={schedule.onSelectTime}
            />
          )}
        </View>
      ) : null}
    </View>
  );
}
