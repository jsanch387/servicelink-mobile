import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { DetailsSectionCard } from './DetailsSectionCard';
import { LabelValueRow } from './LabelValueRow';

export function ScheduleSection({ schedule }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        serviceText: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          marginBottom: 6,
          textAlign: 'left',
        },
      }),
    [colors],
  );

  return (
    <DetailsSectionCard title="Schedule">
      <AppText style={styles.serviceText}>{schedule.serviceName}</AppText>
      <LabelValueRow label="Date" value={schedule.date} />
      <LabelValueRow label="Time" value={schedule.time} />
      <LabelValueRow label="Duration" value={schedule.duration} />
    </DetailsSectionCard>
  );
}
