import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  AppText,
  BottomSheetModal,
  Button,
  InlineCardError,
  TimeSelectField,
} from '../../../../components/ui';
import {
  parseLocalYyyyMmDd,
  startOfLocalDay,
  toLocalYyyyMmDd,
} from '../../../../components/ui/calendarDateKey';
import { useTheme } from '../../../../theme';
import { safeUserFacingMessage } from '../../../../utils/safeUserFacingMessage';
import {
  BOOKING_CALENDAR_MAX_DAYS_AHEAD,
  BookingCalendarCard,
} from '../../../availability/booking';
import { fetchBlockingBookingsInRange } from '../../create-appointment/api/schedulingBookings';
import { confirmOwnerOverlapHeadsUp } from '../../utils/confirmOwnerOverlapHeadsUp';
import { resolveOwnerOverlapHeadsUp, startClockMinutes } from '../../utils/ownerBookingOverlap';

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
 * @param {string} yyyyMmDd
 * @param {string} fallback
 */
function formatServerDateLabel(yyyyMmDd, fallback) {
  const match = String(yyyyMmDd ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return fallback;
  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(parsed.getTime())) return fallback;
  return formatDateForDisplay(parsed);
}

function formatDateForPayload(date) {
  return toLocalYyyyMmDd(date);
}

/** 24-hour `HH:mm` for `PATCH /api/availability/bookings/{id}`. */
function formatTimeForApi(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function BookingRescheduleSheet({
  visible,
  onRequestClose,
  initialStartMs,
  onSubmitReschedule,
  isSubmitting = false,
  businessId = null,
  bookingId = null,
}) {
  const { colors } = useTheme();
  const [dateValue, setDateValue] = useState(() => new Date());
  const [timeValue, setTimeValue] = useState('9:00 AM');
  const [showSuccessState, setShowSuccessState] = useState(false);
  const [savedDate, setSavedDate] = useState('');
  const [savedTime, setSavedTime] = useState('');
  const [submitError, setSubmitError] = useState('');
  const confirmOpenRef = useRef(false);
  const submitLockRef = useRef(false);

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
    setShowSuccessState(false);
    setSavedDate('');
    setSavedTime('');
    setSubmitError('');
    confirmOpenRef.current = false;
    submitLockRef.current = false;
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
          marginTop: 4,
        },
        calendarCard: {
          marginBottom: 8,
        },
        actions: {
          flexDirection: 'row',
          gap: 12,
          width: '100%',
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
  const selectedDateKey = useMemo(() => formatDateForPayload(dateValue), [dateValue]);
  const calendarBounds = useMemo(() => {
    const today = startOfLocalDay(new Date());
    const minDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + BOOKING_CALENDAR_MAX_DAYS_AHEAD);
    if (typeof initialStartMs === 'number' && Number.isFinite(initialStartMs)) {
      const appointmentDay = startOfLocalDay(new Date(initialStartMs));
      if (!Number.isNaN(appointmentDay.getTime())) {
        if (appointmentDay < minDate) minDate.setTime(appointmentDay.getTime());
        if (appointmentDay > maxDate) maxDate.setTime(appointmentDay.getTime());
      }
    }
    return { minDate: startOfLocalDay(minDate), maxDate: startOfLocalDay(maxDate) };
  }, [initialStartMs]);

  function handleSelectDateKey(dateKey) {
    const next = parseLocalYyyyMmDd(dateKey);
    if (!next) return;
    setDateValue((prev) => mergeDateKeepingTime(prev, next));
  }

  function handleTimeChange(nextTimeLabel) {
    setTimeValue(nextTimeLabel);
    setDateValue((prev) => parseSelectTimeToDate(prev, nextTimeLabel));
  }

  async function sendReschedule(scheduledDate, startTime) {
    if (submitLockRef.current || isSubmitting) {
      return;
    }
    submitLockRef.current = true;
    setSubmitError('');
    try {
      const saved = await onSubmitReschedule?.({
        scheduledDate,
        startTime,
      });
      const nextDate = String(saved?.date ?? '').trim() || scheduledDate;
      const nextTime = String(saved?.time ?? '').trim() || timeValue;
      setSavedDate(nextDate);
      setSavedTime(nextTime);
      setShowSuccessState(true);
    } catch (error) {
      setSubmitError(
        safeUserFacingMessage(error, { fallback: 'Could not reschedule this appointment.' }),
      );
    } finally {
      submitLockRef.current = false;
    }
  }

  async function handleUpdateReschedule() {
    if (confirmOpenRef.current || submitLockRef.current || isSubmitting) {
      return;
    }
    confirmOpenRef.current = true;
    setSubmitError('');
    const scheduledDate = formatDateForPayload(dateValue);
    const startTime = formatTimeForApi(dateValue);
    const original =
      typeof initialStartMs === 'number' && Number.isFinite(initialStartMs)
        ? new Date(initialStartMs)
        : null;
    const scheduleMoved =
      !original ||
      Number.isNaN(original.getTime()) ||
      formatDateForPayload(original) !== scheduledDate ||
      startClockMinutes(formatTimeForApi(original)) !== startClockMinutes(startTime);
    if (businessId && scheduleMoved) {
      try {
        const { data } = await fetchBlockingBookingsInRange(
          businessId,
          scheduledDate,
          scheduledDate,
          bookingId,
        );
        const overlapMessage = resolveOwnerOverlapHeadsUp({
          mode: 'reschedule',
          dateKey: scheduledDate,
          startTime,
          rows: data ?? [],
        });
        const canContinueOverlap = await confirmOwnerOverlapHeadsUp(overlapMessage);
        if (!canContinueOverlap) {
          confirmOpenRef.current = false;
          return;
        }
      } catch {
        // Heads-up is optional. Never block save if the day list fails.
      }
    }
    Alert.alert(
      'Reschedule this appointment?',
      `${dateLabel} at ${timeValue}. The customer will be notified if we have their contact info.`,
      [
        {
          text: 'Not now',
          style: 'cancel',
          onPress: () => {
            confirmOpenRef.current = false;
          },
        },
        {
          text: 'Reschedule',
          onPress: () => {
            confirmOpenRef.current = false;
            void sendReschedule(scheduledDate, startTime);
          },
        },
      ],
    );
  }

  function closeSheet() {
    onRequestClose?.();
  }

  return (
    <BottomSheetModal
      allowBackdropClose
      pageSheet={false}
      sheetHeightPercent={92}
      stickyFooter
      title="Reschedule"
      visible={visible}
      onRequestClose={onRequestClose}
      footer={
        <View style={styles.actions}>
          {showSuccessState ? (
            <Button
              fullWidth
              style={styles.actionBtn}
              title="Done"
              variant="surfaceLight"
              onPress={closeSheet}
            />
          ) : (
            <>
              <Button
                fullWidth
                style={styles.actionBtn}
                title="Cancel"
                variant="secondary"
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
            Your booking was moved to {formatServerDateLabel(savedDate, dateLabel)} at{' '}
            {savedTime || timeValue}.
          </AppText>
        </View>
      ) : (
        <>
          <AppText style={styles.subtitle}>
            Choose a new date and time for this appointment.
          </AppText>

          <BookingCalendarCard
            cardStyle={styles.calendarCard}
            maxDate={calendarBounds.maxDate}
            minDate={calendarBounds.minDate}
            selectedDateKey={selectedDateKey}
            onSelectDateKey={handleSelectDateKey}
          />

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
