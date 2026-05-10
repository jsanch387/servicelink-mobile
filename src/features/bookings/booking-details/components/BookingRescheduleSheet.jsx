import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  AppText,
  BottomSheetModal,
  Button,
  InlineCardError,
  TimeSelectField,
} from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { safeUserFacingMessage } from '../../../../utils/safeUserFacingMessage';

function formatDateForDisplay(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return 'Select date';
  }
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeForSelectField(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '9:00 AM';
  }
  const h24 = date.getHours();
  const mins = date.getMinutes();
  const minute = mins >= 30 ? '30' : '00';
  const period = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) {
    h12 = 12;
  }
  return `${h12}:${minute} ${period}`;
}

function normalizeDateValue(raw) {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw;
  }
  if (typeof raw === 'number') {
    const byNumber = new Date(raw);
    if (!Number.isNaN(byNumber.getTime())) {
      return byNumber;
    }
  }
  if (typeof raw === 'string') {
    const byString = new Date(raw);
    if (!Number.isNaN(byString.getTime())) {
      return byString;
    }
  }
  if (raw && typeof raw === 'object') {
    const ts = raw.timestamp ?? raw?.nativeEvent?.timestamp ?? raw?.value ?? raw?.date ?? null;
    if (typeof ts === 'number' || typeof ts === 'string') {
      const byTs = new Date(ts);
      if (!Number.isNaN(byTs.getTime())) {
        return byTs;
      }
    }
  }
  return null;
}

function mergeDateKeepingTime(baseDate, nextCalendarDate) {
  if (!(baseDate instanceof Date) || Number.isNaN(baseDate.getTime())) {
    return nextCalendarDate;
  }
  const merged = new Date(nextCalendarDate);
  merged.setHours(
    baseDate.getHours(),
    baseDate.getMinutes(),
    baseDate.getSeconds(),
    baseDate.getMilliseconds(),
  );
  return merged;
}

function parseSelectTimeToDate(baseDate, timeLabel) {
  const raw = String(timeLabel ?? '').trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return baseDate;
  }
  let hour = Number(match[1]);
  const minute = match[2] === '30' ? 30 : 0;
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  }
  if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  const next = new Date(baseDate);
  next.setHours(hour, minute, 0, 0);
  return next;
}

/**
 * Bottom sheet to pick a new date and time (save / API wiring comes later).
 */
function formatDateForPayload(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTimeForPayload(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}:00`;
}

export function BookingRescheduleSheet({
  visible,
  onRequestClose,
  initialStartMs,
  onSubmitReschedule,
  isSubmitting = false,
}) {
  const { colors } = useTheme();
  const [dateValue, setDateValue] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeValue, setTimeValue] = useState('9:00 AM');
  const [showSuccessState, setShowSuccessState] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!visible) {
      return;
    }
    const base =
      typeof initialStartMs === 'number' &&
      Number.isFinite(initialStartMs) &&
      !Number.isNaN(initialStartMs)
        ? new Date(initialStartMs)
        : new Date();
    const safe = Number.isNaN(base.getTime()) ? new Date() : base;
    setDateValue(safe);
    setTimeValue(formatTimeForSelectField(safe));
    setShowDatePicker(false);
    setShowSuccessState(false);
    setSubmitError('');
  }, [visible, initialStartMs]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        subtitle: {
          color: colors.textMuted,
          fontSize: 15,
          lineHeight: 22,
          marginBottom: 18,
        },
        field: {
          marginBottom: 14,
        },
        dateTrigger: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.inputBorder,
          borderRadius: 16,
          borderWidth: 1,
          flexDirection: 'row',
          minHeight: 48,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        dateTriggerText: {
          color: colors.text,
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
          paddingLeft: 4,
          paddingRight: 10,
          paddingVertical: 8,
        },
        pickerInlineWrap: {
          marginTop: 8,
        },
        actions: {
          flexDirection: 'row',
          gap: 10,
          marginTop: 22,
        },
        actionBtn: {
          flex: 1,
        },
        successWrap: {
          alignItems: 'center',
          borderColor: colors.border,
          borderRadius: 16,
          borderWidth: 1,
          marginTop: 8,
          paddingHorizontal: 14,
          paddingVertical: 24,
          rowGap: 8,
        },
        successTitle: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '700',
        },
        successBody: {
          color: colors.textMuted,
          fontSize: 15,
          lineHeight: 21,
          textAlign: 'center',
        },
        submitErrorWrap: {
          marginTop: 12,
        },
      }),
    [colors],
  );

  const dateLabel = useMemo(() => formatDateForDisplay(dateValue), [dateValue]);

  function handleDateValueChange(event, nextDate) {
    let next = nextDate;
    if (!next && event?.nativeEvent?.timestamp != null) {
      next = new Date(event.nativeEvent.timestamp);
    }
    if (!next) {
      next = normalizeDateValue(event);
    }
    if (!next) {
      return;
    }
    setDateValue((prev) => mergeDateKeepingTime(prev, next));
  }

  function handleDateDismiss() {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  }

  function handleTimeChange(nextTimeLabel) {
    setTimeValue(nextTimeLabel);
    setDateValue((prev) => parseSelectTimeToDate(prev, nextTimeLabel));
  }

  async function handleUpdateReschedule() {
    if (isSubmitting) {
      return;
    }
    setSubmitError('');
    try {
      await onSubmitReschedule?.({
        scheduledDate: formatDateForPayload(dateValue),
        startTime: formatTimeForPayload(dateValue),
      });
      setShowSuccessState(true);
    } catch (error) {
      setSubmitError(safeUserFacingMessage(error, { fallback: 'Could not reschedule booking.' }));
    }
  }

  function closeSheet() {
    onRequestClose?.();
  }

  return (
    <BottomSheetModal
      allowBackdropClose
      maxHeight="92%"
      minHeight="58%"
      title="Reschedule"
      visible={visible}
      onRequestClose={onRequestClose}
      footer={
        <View style={styles.actions}>
          {showSuccessState ? (
            <>
              <Button
                fullWidth
                style={styles.actionBtn}
                title="Done"
                variant="surfaceLight"
                onPress={closeSheet}
              />
            </>
          ) : (
            <>
              <Button
                fullWidth
                labelColor="#ffffff"
                outlineColor="rgba(255,255,255,0.52)"
                style={styles.actionBtn}
                title="Cancel"
                variant="outline"
                onPress={closeSheet}
              />
              <Button
                fullWidth
                style={styles.actionBtn}
                title="Update"
                variant="surfaceLight"
                loading={isSubmitting}
                onPress={handleUpdateReschedule}
              />
            </>
          )}
        </View>
      }
    >
      {showSuccessState ? (
        <View style={styles.successWrap}>
          <Ionicons color="#22c55e" name="checkmark-circle" size={34} />
          <AppText style={styles.successTitle}>Rescheduled</AppText>
          <AppText style={styles.successBody}>
            Your booking was moved to {dateLabel} at {timeValue}.
          </AppText>
        </View>
      ) : (
        <>
          <AppText style={styles.subtitle}>
            Choose a new date and time for this appointment.
          </AppText>

          <Pressable style={styles.dateTrigger} onPress={() => setShowDatePicker(true)}>
            <AppText style={styles.dateTriggerText}>{dateLabel}</AppText>
            <Ionicons color={colors.textMuted} name="calendar-outline" size={20} />
          </Pressable>
          {showDatePicker ? (
            <View style={styles.pickerInlineWrap}>
              <DateTimePicker
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                mode="date"
                value={dateValue}
                onDismiss={handleDateDismiss}
                onValueChange={handleDateValueChange}
              />
            </View>
          ) : null}

          <View style={styles.field} />
          <TimeSelectField
            placeholder="Select time"
            title="New time"
            value={timeValue}
            onValueChange={handleTimeChange}
          />
          {submitError ? (
            <View style={styles.submitErrorWrap}>
              <InlineCardError message={submitError} />
            </View>
          ) : null}
        </>
      )}
    </BottomSheetModal>
  );
}
