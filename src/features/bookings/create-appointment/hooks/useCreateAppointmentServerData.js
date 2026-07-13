import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchBusinessAvailability } from '../../../availability/api/availability';
import { getBookingCalendarRange } from '../../../availability/booking';
import { ownerHasProAccess } from '../../../bookingLink/api/bookingLink';
import { fetchSalesForBusiness } from '../../../marketing/api/sales';
import { fetchAccountSettingsBundle } from '../../../more/api/fetchAccountSettings';
import { fetchActivePriceOptionsForService } from '../api/priceOptions';
import { fetchBusinessServiceLocation } from '../api/fetchBusinessServiceLocation';
import { fetchBlockingBookingsInRange } from '../api/schedulingBookings';
import {
  createAppointmentAvailabilityQueryKey,
  createAppointmentBlockingBookingsQueryKey,
  createAppointmentBusinessLocationQueryKey,
  createAppointmentPriceOptionsQueryKey,
  createAppointmentSalesQueryKey,
} from '../queryKeys';

/**
 * Loads availability, owner Pro flag, price options for the selected service, and blocking bookings
 * for the create-appointment schedule step.
 */
export function useCreateAppointmentServerData({
  businessId,
  userId,
  selectedServiceId,
  excludeBookingId,
}) {
  const { rangeFrom, rangeTo } = useMemo(() => getBookingCalendarRange(), []);

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
    queryKey: [
      ...createAppointmentBlockingBookingsQueryKey(businessId, rangeFrom, rangeTo),
      excludeBookingId ?? '',
    ],
    queryFn: async () => {
      const { data, error } = await fetchBlockingBookingsInRange(
        businessId,
        rangeFrom,
        rangeTo,
        excludeBookingId,
      );
      if (error) throw new Error(error.message ?? 'Could not load bookings');
      return data ?? [];
    },
    enabled: Boolean(businessId),
    staleTime: 60 * 1000,
  });

  const businessLocationQ = useQuery({
    queryKey: createAppointmentBusinessLocationQueryKey(businessId),
    queryFn: async () => {
      const { data, error } = await fetchBusinessServiceLocation(businessId);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(businessId),
    staleTime: 60 * 1000,
  });

  const salesQ = useQuery({
    queryKey: createAppointmentSalesQueryKey(businessId),
    queryFn: async () => {
      const { data, error } = await fetchSalesForBusiness(businessId);
      if (error) throw new Error(error.message ?? 'Could not load sales');
      return data ?? [];
    },
    enabled: Boolean(businessId),
    staleTime: 45 * 1000,
  });

  return {
    ownerHasPro,
    ownerProfileLoading: ownerQ.isPending,
    businessServiceLocation: businessLocationQ.data ?? null,
    businessServiceLocationLoading: businessLocationQ.isPending,
    businessServiceLocationError: businessLocationQ.error?.message ?? null,
    availabilityRow: availabilityQ.data ?? null,
    availabilityLoading: availabilityQ.isPending,
    availabilityError: availabilityQ.error?.message ?? null,
    priceOptionRows: priceOptionsQ.data ?? [],
    priceOptionsLoading: priceOptionsQ.isPending,
    priceOptionsError: priceOptionsQ.error?.message ?? null,
    blockingBookingRows: blockingQ.data ?? [],
    blockingLoading: blockingQ.isPending,
    blockingError: blockingQ.error?.message ?? null,
    sales: salesQ.data ?? [],
    salesLoading: salesQ.isPending,
    rangeFrom,
    rangeTo,
  };
}
