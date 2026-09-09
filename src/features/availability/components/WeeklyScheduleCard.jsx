import { StyleSheet, Switch, View } from 'react-native';
import { useMemo } from 'react';
import { AppText, SurfaceCard, TimeSelectField } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { DAY_DEFINITIONS } from '../utils/availabilityModel';

/**
 * Weekly day toggles + start/end time pickers, one card per day.
 */
export function WeeklyScheduleCard({
  dayEnabledMap,
  dayTimeRanges,
  onDayToggle,
  onDayTimeChange,
  style,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignSelf: 'stretch',
          gap: 10,
        },
        dayCard: {
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        dayHeaderRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        dayShort: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '700',
        },
        dayDetailRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          marginTop: 10,
        },
        timeRangeWrap: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          width: '100%',
        },
        timeSelectCell: {
          flex: 1,
          minWidth: 0,
        },
        timeSelectTrigger: {
          borderRadius: 10,
          minHeight: 38,
          paddingHorizontal: 8,
        },
        toText: {
          color: colors.text,
          fontSize: 12,
          fontWeight: '600',
        },
        unavailableText: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  return (
    <View style={[styles.root, style]}>
      {DAY_DEFINITIONS.map((entry) => (
        <SurfaceCard key={entry.key} outlined={false} padding="none" style={styles.dayCard}>
          <View style={styles.dayHeaderRow}>
            <AppText style={styles.dayShort}>{entry.label}</AppText>
            <Switch
              thumbColor="#f8fafc"
              trackColor={{ false: colors.borderStrong, true: '#10b981' }}
              value={Boolean(dayEnabledMap[entry.label])}
              onValueChange={(next) => onDayToggle(entry.label, next)}
            />
          </View>
          <View style={styles.dayDetailRow}>
            {Boolean(dayEnabledMap[entry.label]) ? (
              <View style={styles.timeRangeWrap}>
                <View style={styles.timeSelectCell}>
                  <TimeSelectField
                    placeholder="Start"
                    title={`${entry.label} start time`}
                    triggerStyle={styles.timeSelectTrigger}
                    value={dayTimeRanges[entry.label]?.start ?? ''}
                    onValueChange={(next) => onDayTimeChange(entry.label, 'start', next)}
                  />
                </View>
                <AppText style={styles.toText}>to</AppText>
                <View style={styles.timeSelectCell}>
                  <TimeSelectField
                    placeholder="End"
                    title={`${entry.label} end time`}
                    triggerStyle={styles.timeSelectTrigger}
                    value={dayTimeRanges[entry.label]?.end ?? ''}
                    onValueChange={(next) => onDayTimeChange(entry.label, 'end', next)}
                  />
                </View>
              </View>
            ) : (
              <AppText style={styles.unavailableText}>Unavailable</AppText>
            )}
          </View>
        </SurfaceCard>
      ))}
    </View>
  );
}
