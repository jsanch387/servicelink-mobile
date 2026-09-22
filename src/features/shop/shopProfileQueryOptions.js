import { fetchBusinessProfileForUser } from '../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../home/queryKeys';

/**
 * Shared shop profile query. A cached `null` stays stale so a member login
 * does not keep the owner-without-shop empty state after membership is known.
 *
 * @param {string | null | undefined} userId
 */
export function shopProfileQueryOptions(userId) {
  return {
    queryKey: homeBusinessProfileQueryKey(userId),
    queryFn: async () => {
      const { data, error } = await fetchBusinessProfileForUser(userId);
      if (error) {
        throw error instanceof Error
          ? error
          : new Error(error.message ?? 'Could not load business');
      }
      return data;
    },
    enabled: Boolean(userId),
    staleTime: (query) => (query.state.data == null ? 0 : 60 * 1000),
    gcTime: 15 * 60 * 1000,
  };
}
