import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchBusinessAvailability } from '../../../availability/api/availability';
import { ownerHasProAccess } from '../../../bookingLink/api/bookingLink';
import { localYyyyMmDd } from '../../../home/utils/bookingStart';
import { fetchAccountSettingsBundle } from '../../../more/api/fetchAccountSettings';
import { toLocalYyyyMmDd } from '../../../../components/ui/calendarDateKey';
import { fetchActivePriceOptionsForService } from '../api/priceOptions';
import { fetchBlockingBookingsInRange } from '../api/schedulingBookings';
import {
  createAppointmentAvailabilityQueryKey,
  createAppointmentBlockingBookingsQueryKey,
  createAppointmentPriceOptionsQueryKey,
} from '../queryKeys';

function addDaysYyyyMmDd(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalYyyyMmDd(d);
}

/**
 * Loads availability, owner Pro flag, price options for the selected service, and blocking bookings
 * for the create-appointment schedule step.
 */
export function useCreateAppointmentServerData({ businessId, userId, selectedServiceId }) {
  const rangeFrom = useMemo(() => localYyyyMmDd(), []);
  const rangeTo = useMemo(() => addDaysYyyyMmDd(120), []);

  const ownerQ = useQuery({
    queryKey: ['createAppointment', 'ownerProfile', userId],
    queryFn: async () => {
      const bundle = await fetchAccountSettingsBundle(userId);
      if (bundle.error) throw bundle.error;
      return bundle.ownerProfile;
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });

  const ownerHasPro = ownerHasProAccess(ownerQ.data ?? null);

  const availabilityQ = useQuery({
    queryKey: createAppointmentAvailabilityQueryKey(businessId),
    queryFn: async () => {
      const { data, error } = await fetchBusinessAvailability(businessId);
      if (error) throw new Error(error.message ?? 'Could not load availability');
      return data ?? null;
    },
    enabled: Boolean(businessId),
    staleTime: 45 * 1000,
  });

  const priceOptionsQ = useQuery({
    queryKey: createAppointmentPriceOptionsQueryKey(businessId, selectedServiceId),
    queryFn: async () => {
      const { data, error } = await fetchActivePriceOptionsForService(
        businessId,
        selectedServiceId,
      );
      if (error) throw new Error(error.message ?? 'Could not load price options');
      return data ?? [];
    },
    enabled: Boolean(businessId && selectedServiceId),
    staleTime: 45 * 1000,
  });

  const blockingQ = useQuery({
    queryKey: createAppointmentBlockingBookingsQueryKey(businessId, rangeFrom, rangeTo),
    queryFn: async () => {
      const { data, error } = await fetchBlockingBookingsInRange(businessId, rangeFrom, rangeTo);
      if (error) throw new Error(error.message ?? 'Could not load bookings');
      return data ?? [];
    },
    enabled: Boolean(businessId),
    staleTime: 60 * 1000,
  });

  return {
    ownerHasPro,
    ownerProfileLoading: ownerQ.isPending,
    availabilityRow: availabilityQ.data ?? null,
    availabilityLoading: availabilityQ.isPending,
    availabilityError: availabilityQ.error?.message ?? null,
    priceOptionRows: priceOptionsQ.data ?? [],
    priceOptionsLoading: priceOptionsQ.isPending,
    priceOptionsError: priceOptionsQ.error?.message ?? null,
    blockingBookingRows: blockingQ.data ?? [],
    blockingLoading: blockingQ.isPending,
    blockingError: blockingQ.error?.message ?? null,
    rangeFrom,
    rangeTo,
  };
}
