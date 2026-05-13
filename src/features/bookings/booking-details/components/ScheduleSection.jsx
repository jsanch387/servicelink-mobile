import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  DetailIconFieldRow,
  DetailsSectionCard,
  Divider,
} from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';

export function ScheduleSection({ schedule }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          gap: 16,
          paddingVertical: 2,
        },
        fieldsStack: {
          gap: 18,
        },
        serviceText: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 18,
          fontWeight: '600',
          letterSpacing: -0.35,
          lineHeight: 24,
          textAlign: 'left',
        },
      }),
    [colors],
  );

  return (
    <DetailsSectionCard bodyPadding="roomy" title="Schedule">
      <View style={styles.stack}>
        <AppText style={styles.serviceText}>{schedule.serviceName}</AppText>
        <Divider />
        <View style={styles.fieldsStack}>
          <DetailIconFieldRow icon="calendar-outline" label="Date" value={schedule.date} />
          <DetailIconFieldRow icon="time-outline" label="Time" value={schedule.time} />
          <DetailIconFieldRow icon="hourglass-outline" label="Duration" value={schedule.duration} />
        </View>
      </View>
    </DetailsSectionCard>
  );
}
