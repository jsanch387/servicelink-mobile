import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { getBookingLinkDisplay } from '../../home/utils/bookingLink';

/**
 * Business name + public booking link for marketing share graphics.
 * Reuses the cached home business profile query.
 */
export function useMarketingShareBusiness() {
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
    const name = String(businessQ.data?.business_name ?? '').trim();
    const slug = businessQ.data?.business_slug;
    return {
      businessName: name || 'Your business',
      bookingLinkDisplay: getBookingLinkDisplay(slug),
      isLoading: businessQ.isPending,
    };
  }, [businessQ.data?.business_name, businessQ.data?.business_slug, businessQ.isPending]);
}
