import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { WeeklyScheduleCard } from './WeeklyScheduleCard';

/**
 * “Weekly schedule” heading + per-day cards (same layout as the main Availability screen).
 */
export function WeeklyScheduleSection({
  dayEnabledMap,
  dayTimeRanges,
  onDayToggle,
  onDayTimeChange,
  style,
  showTitle = true,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        sectionTitle: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
          marginBottom: 8,
          marginTop: 4,
        },
      }),
    [colors],
  );

  return (
    <View style={style}>
      {showTitle ? <AppText style={styles.sectionTitle}>Weekly schedule</AppText> : null}
      <WeeklyScheduleCard
        dayEnabledMap={dayEnabledMap}
        dayTimeRanges={dayTimeRanges}
        onDayTimeChange={onDayTimeChange}
        onDayToggle={onDayToggle}
      />
    </View>
  );
}
