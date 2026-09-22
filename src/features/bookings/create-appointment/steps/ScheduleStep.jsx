import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BookingDateTimePicker } from '../../../availability/booking';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { resolveOwnerOverlapHeadsUp } from '../../utils/ownerBookingOverlap';

/**
 * Create-appointment schedule step — shared picker plus a non-blocking overlap heads-up.
 */
export function ScheduleStep({ blockingBookingRows = [], overlapMode = 'create', ...pickerProps }) {
  const { colors } = useTheme();
  const headsUp = resolveOwnerOverlapHeadsUp({
    mode: overlapMode,
    dateKey: pickerProps.selectedDateKey,
    startTime: pickerProps.selectedTime,
    rows: blockingBookingRows,
    tone: 'picker',
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        notice: {
          alignItems: 'flex-start',
          backgroundColor: colors.inputBg,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          gap: 8,
          marginTop: 14,
          paddingHorizontal: 12,
          paddingVertical: 10,
        },
        noticeCopy: {
          flex: 1,
          minWidth: 0,
        },
        noticeText: {
          color: colors.textSecondary,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 20,
        },
      }),
    [colors],
  );

  return (
    <BookingDateTimePicker
      {...pickerProps}
      belowTimes={
        headsUp ? (
          <View accessibilityLiveRegion="polite" style={styles.notice}>
            <Ionicons color={colors.textMuted} name="information-circle-outline" size={18} />
            <View style={styles.noticeCopy}>
              <AppText style={styles.noticeText}>{headsUp}</AppText>
            </View>
          </View>
        ) : null
      }
    />
  );
}
