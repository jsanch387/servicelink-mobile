import { useEffect, useMemo } from 'react';
import { parseLocalYyyyMmDd, toLocalYyyyMmDd } from '../../../../components/ui/calendarDateKey';
import { getBookingCalendarRange } from '../utils/bookingCalendarRange';
import {
  createIsDateUnavailableFn,
  getTimeSlotsForDateKey,
  isSelectedScheduleStillValid,
} from '../utils/bookingCalendar';
import { parseScheduleInputs } from '../utils/scheduleInputs';

/**
 * Shared booking calendar state: slot list, disabled days, formatted labels, range bounds.
 *
 * @param {object} p
 * @param {Record<string, unknown> | null | undefined} p.availabilityRow
 * @param {unknown[]} p.blockingBookingRows
 * @param {number} p.totalDurationMinutes
 * @param {string | null} p.selectedDateKey
 * @param {string | null} p.selectedTime
 * @param {(key: string | null) => void} p.onSelectDateKey
 * @param {(time: string | null) => void} p.onSelectTime
 * @param {boolean} p.scheduleLoading
 * @param {boolean} [p.relaxScheduleValidation] keep pinned date/time when editing an existing booking
 * @param {string | null} [p.pinnedDateKey]
 * @param {string | null} [p.pinnedTime]
 */
export function useBookingCalendar({
  availabilityRow,
  blockingBookingRows,
  totalDurationMinutes,
  selectedDateKey,
  selectedTime,
  onSelectDateKey,
  onSelectTime,
  scheduleLoading,
  relaxScheduleValidation = false,
  pinnedDateKey = null,
  pinnedTime = null,
}) {
  const { acceptBookings, weeklySchedule, timeOffBlocks } = useMemo(
    () => parseScheduleInputs(availabilityRow),
    [availabilityRow],
  );

  const scheduleCtx = useMemo(
    () => ({
      acceptBookings,
      weeklySchedule,
      totalDurationMinutes,
      blockingBookingRows: blockingBookingRows ?? [],
      timeOffBlocks,
    }),
    [acceptBookings, weeklySchedule, totalDurationMinutes, blockingBookingRows, timeOffBlocks],
  );

  const { minDate, maxDate } = useMemo(() => getBookingCalendarRange(), []);

  const timeSlots = useMemo(() => {
    const slots = getTimeSlotsForDateKey(selectedDateKey, scheduleCtx);
    if (
      relaxScheduleValidation &&
      pinnedTime &&
      selectedDateKey &&
      pinnedDateKey &&
      selectedDateKey === pinnedDateKey &&
      !slots.includes(pinnedTime)
    ) {
      return [...slots, pinnedTime];
    }
    return slots;
  }, [selectedDateKey, scheduleCtx, relaxScheduleValidation, pinnedDateKey, pinnedTime]);

  const isDateUnavailable = useMemo(() => {
    const base = createIsDateUnavailableFn(scheduleCtx);
    if (!relaxScheduleValidation || !pinnedDateKey) {
      return base;
    }
    return (d) => {
      const key = toLocalYyyyMmDd(d);
      if (key && key === pinnedDateKey) {
        return false;
      }
      return base(d);
    };
  }, [scheduleCtx, relaxScheduleValidation, pinnedDateKey]);

  useEffect(() => {
    if (scheduleLoading || !selectedDateKey) return;

    if (
      relaxScheduleValidation &&
      pinnedDateKey &&
      selectedDateKey === pinnedDateKey &&
      parseLocalYyyyMmDd(selectedDateKey)
    ) {
      if (pinnedTime && selectedTime === pinnedTime) {
        return;
      }
    }

    const { dateValid, timeValid } = isSelectedScheduleStillValid(
      scheduleCtx,
      selectedDateKey,
      selectedTime,
      { scheduleLoading: false },
    );
    if (!dateValid) {
      onSelectDateKey(null);
      onSelectTime(null);
      return;
    }
    if (selectedTime && !timeValid) {
      onSelectTime(null);
    }
  }, [
    scheduleLoading,
    selectedDateKey,
    selectedTime,
    scheduleCtx,
    onSelectDateKey,
    onSelectTime,
    relaxScheduleValidation,
    pinnedDateKey,
    pinnedTime,
  ]);

  return {
    acceptBookings,
    minDate,
    maxDate,
    timeSlots,
    isDateUnavailable,
    scheduleCtx,
  };
}
