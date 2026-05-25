import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { fetchBusinessAvailability } from '../../../availability/api/availability';
import { getBookingCalendarRange, useBookingCalendar } from '../../../availability/booking';
import { serviceDurationHHmmToMinutes } from '../../../../components/ui/durationTime';
import { fetchBlockingBookingsInRange } from '../../../bookings/create-appointment/api/schedulingBookings';

export function maintenanceInviteScheduleQueryKey(businessId) {
  return ['maintenanceInvite', 'schedule', businessId ?? 'none'];
}

/**
 * Availability + open slots for the maintenance offer schedule step (same rules as new appointment).
 *
 * @param {object} p
 * @param {string | null | undefined} p.businessId
 * @param {string} p.durationHhMm
 * @param {string} p.preferredDateYyyyMmDd
 * @param {string} p.preferredTime12h
 * @param {(date: string) => void} p.setPreferredDateYyyyMmDd
 * @param {(time: string) => void} p.setPreferredTime12h
 */
export function useMaintenanceInviteSchedule({
  businessId,
  durationHhMm,
  preferredDateYyyyMmDd,
  preferredTime12h,
  setPreferredDateYyyyMmDd,
  setPreferredTime12h,
}) {
  const { rangeFrom, rangeTo } = useMemo(() => getBookingCalendarRange(), []);

  const totalDurationMinutes = useMemo(() => {
    const minutes = serviceDurationHHmmToMinutes(durationHhMm);
    return Number.isFinite(minutes) && minutes > 0 ? minutes : 60;
  }, [durationHhMm]);

  const availabilityQ = useQuery({
    queryKey: [...maintenanceInviteScheduleQueryKey(businessId), 'availability'],
    queryFn: async () => {
      const { data, error } = await fetchBusinessAvailability(businessId);
      if (error) {
        throw new Error(error.message ?? 'Could not load availability');
      }
      return data ?? null;
    },
    enabled: Boolean(businessId),
    staleTime: 45 * 1000,
  });

  const blockingQ = useQuery({
    queryKey: [...maintenanceInviteScheduleQueryKey(businessId), 'blocking', rangeFrom, rangeTo],
    queryFn: async () => {
      const { data, error } = await fetchBlockingBookingsInRange(businessId, rangeFrom, rangeTo);
      if (error) {
        throw new Error(error.message ?? 'Could not load bookings');
      }
      return data ?? [];
    },
    enabled: Boolean(businessId),
    staleTime: 60 * 1000,
  });

  const scheduleLoading =
    availabilityQ.isPending ||
    blockingQ.isPending ||
    availabilityQ.isFetching ||
    blockingQ.isFetching;
  const scheduleError = availabilityQ.error?.message ?? blockingQ.error?.message ?? null;

  const selectedDateKey = String(preferredDateYyyyMmDd ?? '').trim() || null;
  const selectedTime = String(preferredTime12h ?? '').trim() || null;

  const onSelectDateKey = useCallback(
    (key) => {
      const next = key ?? '';
      setPreferredDateYyyyMmDd(next);
      setPreferredTime12h('');
    },
    [setPreferredDateYyyyMmDd, setPreferredTime12h],
  );

  const onSelectTime = useCallback(
    (time) => {
      setPreferredTime12h(time ?? '');
    },
    [setPreferredTime12h],
  );

  const calendar = useBookingCalendar({
    availabilityRow: availabilityQ.data ?? null,
    blockingBookingRows: blockingQ.data ?? [],
    totalDurationMinutes,
    selectedDateKey,
    selectedTime,
    onSelectDateKey,
    onSelectTime,
    scheduleLoading,
  });

  return {
    acceptBookings: calendar.acceptBookings,
    isDateUnavailable: calendar.isDateUnavailable,
    minDate: calendar.minDate,
    maxDate: calendar.maxDate,
    onSelectDateKey,
    onSelectTime,
    scheduleError,
    scheduleLoading,
    selectedDateKey,
    selectedTime,
    timeSlots: calendar.timeSlots,
  };
}
