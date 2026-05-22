import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { showWebAccountFeatureAlert } from '../../subscription';
import { fetchLinkViewsCount, fetchLinkViewsLastViewedAt } from '../api/linkViewsAnalytics';
import { linkViewsPeriodAccessCopy } from '../constants/linkViewsAccessCopy';
import { LINK_VIEWS_DEFAULT_PERIOD } from '../constants/linkViews';
import {
  homeLinkViewsCountQueryKey,
  homeLinkViewsLastVisitQueryKey,
  HOME_QUERY_KEY,
} from '../queryKeys';
import {
  isProOnlyLinkViewsPeriod,
  resolveEffectiveLinkViewsPeriod,
} from '../utils/linkViewsPeriod';

/**
 * Link view count (rolling window) + last visit from `public_analytics_events`.
 *
 * @param {string | null | undefined} businessProfileId
 * @param {{ enabled?: boolean; hasProAccess?: boolean }} [options]
 */
export function useLinkViewsAnalytics(businessProfileId, options = {}) {
  const { enabled = true, hasProAccess = false } = options;
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState(LINK_VIEWS_DEFAULT_PERIOD);
  const effectivePeriod = resolveEffectiveLinkViewsPeriod(period, hasProAccess);
  const queryEnabled = Boolean(businessProfileId) && enabled;

  const countQ = useQuery({
    queryKey: homeLinkViewsCountQueryKey(businessProfileId, effectivePeriod),
    queryFn: async () => {
      const { count, error } = await fetchLinkViewsCount(businessProfileId, period, hasProAccess);
      if (error) {
        throw new Error(error.message ?? 'Could not load link visits');
      }
      return count;
    },
    enabled: queryEnabled,
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const lastVisitQ = useQuery({
    queryKey: homeLinkViewsLastVisitQueryKey(businessProfileId),
    queryFn: async () => {
      const { lastViewedAt, error } = await fetchLinkViewsLastViewedAt(businessProfileId);
      if (error) {
        throw new Error(error.message ?? 'Could not load last visit');
      }
      return lastViewedAt;
    },
    enabled: queryEnabled,
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const onPeriodChange = useCallback(
    (next) => {
      if (!hasProAccess && isProOnlyLinkViewsPeriod(next)) {
        showWebAccountFeatureAlert({
          title: linkViewsPeriodAccessCopy.alertTitle,
          message: linkViewsPeriodAccessCopy.alertMessage,
        });
        return;
      }
      setPeriod(next);
    },
    [hasProAccess],
  );

  const refetch = useCallback(() => {
    return queryClient.refetchQueries({ queryKey: HOME_QUERY_KEY });
  }, [queryClient]);

  const viewsError = countQ.isError
    ? (countQ.error?.message ?? 'Could not load link visits')
    : null;

  return {
    views: countQ.data ?? 0,
    lastViewedAt: lastVisitQ.data ?? null,
    period,
    effectivePeriod,
    onPeriodChange,
    isPendingViews: queryEnabled && countQ.isPending,
    isPendingLastVisit: queryEnabled && lastVisitQ.isPending,
    viewsError,
    refetch,
  };
}
