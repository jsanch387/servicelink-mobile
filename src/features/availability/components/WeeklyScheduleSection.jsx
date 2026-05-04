import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { WeeklyScheduleCard } from './WeeklyScheduleCard';

/**
 * “Weekly schedule” heading + card-wrapped day toggles (same layout as the main Availability screen).
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
        scheduleCard: {
          borderRadius: 16,
          paddingHorizontal: 0,
          paddingVertical: 0,
        },
      }),
    [colors],
  );

  return (
    <View style={style}>
      {showTitle ? <AppText style={styles.sectionTitle}>Weekly schedule</AppText> : null}
      <SurfaceCard style={styles.scheduleCard}>
        <WeeklyScheduleCard
          dayEnabledMap={dayEnabledMap}
          dayTimeRanges={dayTimeRanges}
          onDayTimeChange={onDayTimeChange}
          onDayToggle={onDayToggle}
        />
      </SurfaceCard>
    </View>
  );
}
