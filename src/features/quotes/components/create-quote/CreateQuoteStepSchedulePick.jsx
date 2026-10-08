import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, MonthCalendar, TimeSelectField } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { formatScheduledDateUserFacing } from '../../utils/formatScheduledDateDisplay';

/**
 * Calendar and start time for an owner-proposed quote schedule.
 *
 * @param {object} props
 * @param {string} props.scheduledDateYyyyMmDd
 * @param {(t: string) => void} props.onScheduledDateChange
 * @param {string} props.scheduledStartTime12h
 * @param {(t: string) => void} props.onScheduledStartTimeChange
 */
export function CreateQuoteStepSchedulePick({
  scheduledDateYyyyMmDd,
  onScheduledDateChange,
  scheduledStartTime12h,
  onScheduledStartTimeChange,
}) {
  const { colors } = useTheme();
  const range = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const max = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());
    return { minDate: today, maxDate: max };
  }, []);
  const dateLabel = formatScheduledDateUserFacing(scheduledDateYyyyMmDd);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          gap: 14,
        },
        dateLabel: {
          color: dateLabel ? colors.text : colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          textAlign: 'left',
        },
      }),
    [colors, dateLabel],
  );

  return (
    <View style={styles.stack}>
      <MonthCalendar
        maxDate={range.maxDate}
        minDate={range.minDate}
        selectedDateKey={scheduledDateYyyyMmDd || null}
        onSelectDateKey={onScheduledDateChange}
      />
      <AppText style={styles.dateLabel}>{dateLabel || 'Choose a day'}</AppText>
      <TimeSelectField
        placeholder="Select time"
        title="Start time"
        value={scheduledStartTime12h}
        onValueChange={onScheduledStartTimeChange}
      />
    </View>
  );
}
