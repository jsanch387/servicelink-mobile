import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import {
  getBookingLinkDisplay,
  getBookingLinkHttpsUrl,
  normalizeBusinessSlug,
} from '../../home/utils/bookingLink';

/**
 * Booking-link URL for the QR screen (reuses home business profile cache).
 */
export function useQrCodeBookingLink() {
  const { user } = useAuth();
  const userId = user?.id;

  const businessQ = useQuery({
    queryKey: homeBusinessProfileQueryKey(userId),
    queryFn: async () => {
      const { data, error } = await fetchBusinessProfileForUser(userId);
      if (error) {
        throw new Error(error.message ?? 'Could not load business');
      }
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  return useMemo(() => {
    const slug = normalizeBusinessSlug(businessQ.data?.business_slug);
    const name = String(businessQ.data?.business_name ?? '').trim();
    return {
      slug,
      businessName: name,
      bookingLinkDisplay: getBookingLinkDisplay(slug),
      bookingLinkUrl: getBookingLinkHttpsUrl(slug),
      isLoading: Boolean(userId) && businessQ.isPending,
      isError: businessQ.isError,
      errorMessage:
        businessQ.error instanceof Error
          ? businessQ.error.message
          : 'Could not load your booking link.',
      refetch: businessQ.refetch,
    };
  }, [
    businessQ.data?.business_name,
    businessQ.data?.business_slug,
    businessQ.error,
    businessQ.isError,
    businessQ.isPending,
    businessQ.refetch,
    userId,
  ]);
}
