import { useMemo } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { BookingWindowsSection } from './BookingWindowsSection';
import { TimeOffSection } from './TimeOffSection';

/**
 * Settings tab: accept bookings, time off, lead time, and buffer time.
 *
 * @param {{
 *   hasActiveDay: boolean;
 *   isAcceptingRequests: boolean;
 *   onAcceptingChange: (next: boolean) => void;
 *   timeOffBlocks: Array<object>;
 *   onAddTimeOff: () => void;
 *   onDeleteTimeOff: (index: number) => void;
 *   minimumNotice: string;
 *   onMinimumNoticeChange: (next: string) => void;
 *   bufferTime: string;
 *   onBufferTimeChange: (next: string) => void;
 * }} props
 */
export function AvailabilitySettingsView({
  hasActiveDay,
  isAcceptingRequests,
  onAcceptingChange,
  timeOffBlocks,
  onAddTimeOff,
  onDeleteTimeOff,
  minimumNotice,
  onMinimumNoticeChange,
  bufferTime,
  onBufferTimeChange,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        toggleCard: {
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        toggleRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        toggleTextWrap: {
          flex: 1,
          paddingRight: 12,
        },
        toggleTitle: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '700',
          marginBottom: 6,
        },
        toggleHint: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
        },
      }),
    [colors],
  );

  return (
    <>
      <SurfaceCard style={styles.toggleCard}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextWrap}>
            <AppText style={styles.toggleTitle}>Accept booking requests</AppText>
            <AppText style={styles.toggleHint}>
              {!hasActiveDay
                ? 'Turn on at least one day on Your schedule before you can accept booking requests.'
                : isAcceptingRequests
                  ? 'Turn this off to stop accepting appointments.'
                  : 'Turn this on to start accepting appointments.'}
            </AppText>
          </View>
          <Switch
            accessibilityLabel="Accept booking requests"
            disabled={!hasActiveDay && !isAcceptingRequests}
            onValueChange={onAcceptingChange}
            thumbColor={isAcceptingRequests ? '#f8fafc' : '#f4f4f5'}
            trackColor={{ false: colors.borderStrong, true: '#10b981' }}
            value={isAcceptingRequests}
          />
        </View>
      </SurfaceCard>

      <TimeOffSection
        blocks={timeOffBlocks}
        onAddPress={onAddTimeOff}
        onDeletePress={onDeleteTimeOff}
      />

      <BookingWindowsSection
        bufferTime={bufferTime}
        leadTime={minimumNotice}
        onBufferTimeChange={onBufferTimeChange}
        onLeadTimeChange={onMinimumNoticeChange}
      />
    </>
  );
}
