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
  const serviceName = String(schedule.serviceName ?? '').trim();

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
        serviceBlock: {
          gap: 4,
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
        pricingOptionText: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '500',
          letterSpacing: 0,
          lineHeight: 15,
          textAlign: 'left',
        },
      }),
    [colors],
  );

  return (
    <DetailsSectionCard bodyPadding="roomy" title="Schedule">
      <View style={styles.stack}>
        <View style={styles.serviceBlock}>
          <AppText style={styles.serviceText}>{serviceName}</AppText>
          {schedule.pricingOption ? (
            <AppText style={styles.pricingOptionText}>{schedule.pricingOption}</AppText>
          ) : null}
        </View>
        <Divider />
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
      </View>
    </DetailsSectionCard>
  );
}
