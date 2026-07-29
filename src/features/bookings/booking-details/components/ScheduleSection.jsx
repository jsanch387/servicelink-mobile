import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  DetailIconFieldRow,
  DetailsSectionCard,
  Divider,
} from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';

/**
 * Single-job: service title + option above date/time/duration (legacy layout).
 * Multi-job: date/time/duration only — jobs live in {@link BookingJobsSummarySection}.
 */
export function ScheduleSection({ schedule }) {
  const { colors } = useTheme();
  const isMultiJob = Boolean(schedule?.isMultiJob);
  const serviceName = String(schedule.serviceName ?? '').trim();
  const jobs = Array.isArray(schedule?.jobs) ? schedule.jobs : [];
  const single = !isMultiJob ? jobs[0] : null;

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

  const fields = (
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
  );

  return (
    <DetailsSectionCard bodyPadding="roomy" title="Schedule">
      {isMultiJob ? (
        fields
      ) : (
        <View style={styles.stack}>
          <View style={styles.serviceBlock}>
            <AppText style={styles.serviceText}>
              {String(single?.serviceName ?? serviceName).trim() || serviceName}
            </AppText>
            {single?.pricingOption || schedule.pricingOption ? (
              <AppText style={styles.pricingOptionText}>
                {single?.pricingOption || schedule.pricingOption}
              </AppText>
            ) : null}
          </View>
          <Divider />
          {fields}
        </View>
      )}
    </DetailsSectionCard>
  );
}
