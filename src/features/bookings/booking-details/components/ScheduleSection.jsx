import { StyleSheet, View } from 'react-native';
import { DetailIconFieldRow, DetailsSectionCard } from '../../../../components/ui';

/**
 * Date / time / duration only. Service, pricing option, vehicle, and add-ons
 * live in {@link BookingJobsSummarySection} job cards (single- and multi-job).
 */
export function ScheduleSection({ schedule }) {
  return (
    <DetailsSectionCard bodyPadding="roomy" title="Schedule">
      <View style={styles.fieldsStack}>
        <DetailIconFieldRow
          icon="calendar-outline"
          label="Date"
          labelUppercase={false}
          value={schedule.date}
        />
        <DetailIconFieldRow
          icon="time-outline"
          label="Time"
          labelUppercase={false}
          value={schedule.time}
        />
        <DetailIconFieldRow
          icon="hourglass-outline"
          label="Duration"
          labelUppercase={false}
          value={schedule.duration}
        />
      </View>
    </DetailsSectionCard>
  );
}

const styles = StyleSheet.create({
  fieldsStack: {
    gap: 18,
  },
});
