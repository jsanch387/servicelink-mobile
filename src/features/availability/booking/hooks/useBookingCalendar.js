import { useEffect, useMemo } from 'react';
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

  const timeSlots = useMemo(
    () => getTimeSlotsForDateKey(selectedDateKey, scheduleCtx),
    [selectedDateKey, scheduleCtx],
  );

  const isDateUnavailable = useMemo(() => createIsDateUnavailableFn(scheduleCtx), [scheduleCtx]);

  useEffect(() => {
    if (scheduleLoading || !selectedDateKey) return;
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
  }, [scheduleLoading, selectedDateKey, selectedTime, scheduleCtx, onSelectDateKey, onSelectTime]);

  return {
    acceptBookings,
    minDate,
    maxDate,
    timeSlots,
    isDateUnavailable,
    scheduleCtx,
  };
}
