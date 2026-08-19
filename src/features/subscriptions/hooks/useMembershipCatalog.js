import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { fetchMembershipCatalog } from '../api/fetchMembershipCatalog';
import { membershipCatalogQueryKey } from '../queryKeys';
import { SUBSCRIPTIONS_TAB_ACTIVE, SUBSCRIPTIONS_TAB_CANCELED } from '../constants';
import { useSubscriptionsAccess } from './useSubscriptionsAccess';

/**
 * Owner memberships catalog — plans + subscribers.
 */
export function useMembershipCatalog() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { canUseSubscriptions } = useSubscriptionsAccess();

  const businessQ = useQuery({
    queryKey: homeBusinessProfileQueryKey(userId),
    queryFn: async () => {
      const { data, error } = await fetchBusinessProfileForUser(userId);
      if (error) {
        throw new Error(error.message ?? 'Could not load business');
      }
      return data;
    },
    enabled: Boolean(userId) && canUseSubscriptions,
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const businessId = businessQ.data?.id ?? null;
  const hasBusinessRow = Boolean(businessId);

  const catalogQ = useQuery({
    queryKey: membershipCatalogQueryKey(businessId),
    queryFn: async () => {
      const { plans, subscribers, error } = await fetchMembershipCatalog(businessId);
      if (error) {
        throw new Error(error.message ?? 'Could not load subscriptions');
      }
      return { plans, subscribers };
    },
    enabled: hasBusinessRow && canUseSubscriptions,
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const plans = catalogQ.data?.plans ?? [];
  const subscribers = catalogQ.data?.subscribers ?? [];

  return {
    businessId,
    plans,
    subscribers,
    isPending:
      canUseSubscriptions &&
      Boolean(userId) &&
      (businessQ.isPending || (hasBusinessRow && catalogQ.isPending)),
    isFetching: businessQ.isFetching || catalogQ.isFetching,
    isError: businessQ.isError || catalogQ.isError,
    errorMessage:
      businessQ.error?.message ||
      catalogQ.error?.message ||
      (businessQ.isSuccess && !hasBusinessRow ? 'Business profile not found' : null),
    refetch: async () => {
      await businessQ.refetch();
      if (hasBusinessRow) await catalogQ.refetch();
    },
  };
}

/**
 * @param {ReturnType<typeof useMembershipCatalog>['subscribers']} subscribers
 * @param {'active' | 'canceled' | string} listTab
 */
export function filterSubscribersByListTab(subscribers, listTab) {
  const rows = Array.isArray(subscribers) ? subscribers : [];
  if (listTab === SUBSCRIPTIONS_TAB_CANCELED) {
    return rows.filter((row) => row.isCanceledList);
  }
  // default Active
  if (listTab === SUBSCRIPTIONS_TAB_ACTIVE || !listTab) {
    return rows.filter((row) => row.isActiveList);
  }
  return rows.filter((row) => row.isActiveList);
}

/**
 * @param {string | null | undefined} planId
 */
export function useMembershipPlan(planId) {
  const catalog = useMembershipCatalog();
  const id = String(planId ?? '').trim();
  const plan = useMemo(
    () => catalog.plans.find((row) => row.id === id) ?? null,
    [catalog.plans, id],
  );
  const planSubscribers = useMemo(
    () => catalog.subscribers.filter((row) => row.planId === id),
    [catalog.subscribers, id],
  );
  return { ...catalog, plan, planSubscribers };
}

/**
 * @param {string | null | undefined} subscriberId
 */
export function useMembershipSubscriber(subscriberId) {
  const catalog = useMembershipCatalog();
  const id = String(subscriberId ?? '').trim();
  const subscriber = useMemo(
    () => catalog.subscribers.find((row) => row.id === id) ?? null,
    [catalog.subscribers, id],
  );
  return { ...catalog, subscriber };
}
