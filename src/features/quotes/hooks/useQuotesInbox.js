import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { updateAcceptQuoteRequests } from '../api/acceptQuoteRequests';
import { fetchQuotesForBusiness } from '../api/quotes';
import { QUOTES_QUERY_ROOT, quotesListQueryKey } from '../queryKeys';
import {
  deriveQuoteDetailKind,
  groupQuotesByWorkflow,
  mapQuoteRequestCard,
  mapSentQuoteCard,
} from '../utils/quotePresentation';
import { QUOTE_DETAIL_KIND_REQUEST } from '../constants';
import { quotesDebugError, quotesFormatSupabaseError } from '../utils/quotesDebug';

export function useQuotesInbox() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [acceptQuoteRequestsSaving, setAcceptQuoteRequestsSaving] = useState(false);
  const [acceptQuoteRequestsError, setAcceptQuoteRequestsError] = useState(
    /** @type {string | null} */ (null),
  );

  useFocusEffect(
    useCallback(() => {
      void queryClient.refetchQueries({
        queryKey: QUOTES_QUERY_ROOT,
        type: 'active',
        stale: true,
      });
    }, [queryClient]),
  );

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

  const business = businessQ.data ?? null;
  const businessId = business?.id;
  const hasBusinessRow = Boolean(businessId);

  const acceptQuoteRequests = business?.accept_quote_req === true;

  const persistAcceptQuoteRequests = useCallback(
    async (next) => {
      if (!businessId || !userId || acceptQuoteRequestsSaving) return;

      setAcceptQuoteRequestsError(null);
      setAcceptQuoteRequestsSaving(true);

      const profileKey = homeBusinessProfileQueryKey(userId);
      const previous = queryClient.getQueryData(profileKey);
      const prevFlag =
        previous && typeof previous === 'object' && previous.accept_quote_req === true;

      queryClient.setQueryData(profileKey, (old) => {
        if (!old || typeof old !== 'object') return old;
        return { ...old, accept_quote_req: next };
      });

      const { error } = await updateAcceptQuoteRequests(businessId, next);
      setAcceptQuoteRequestsSaving(false);

      if (error) {
        queryClient.setQueryData(profileKey, (old) => {
          if (!old || typeof old !== 'object') return old;
          return { ...old, accept_quote_req: prevFlag };
        });
        const msg =
          error.message?.trim() ||
          'Could not save this setting. Check your connection and try again.';
        setAcceptQuoteRequestsError(msg);
        quotesDebugError('useQuotesInbox:persistAcceptQuoteRequests', msg, {
          formatted: quotesFormatSupabaseError(error),
          businessId,
        });
      }
    },
    [acceptQuoteRequestsSaving, businessId, queryClient, userId],
  );

  const listQ = useQuery({
    queryKey: quotesListQueryKey(businessId),
    queryFn: async () => {
      const { data, error } = await fetchQuotesForBusiness(businessId);
      if (error) {
        quotesDebugError(
          'useQuotesInbox:listQuery:throw',
          error.message ?? 'Could not load quotes',
          {
            businessId,
            formatted: quotesFormatSupabaseError(error),
          },
        );
        throw new Error(error.message ?? 'Could not load quotes');
      }
      return data ?? [];
    },
    enabled: hasBusinessRow,
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const { quoteGroups, totalQuotesCount } = useMemo(() => {
    const rows = listQ.data ?? [];
    const nowMs = Date.now();
    const groups = groupQuotesByWorkflow(rows);
    const mappedGroups = Object.fromEntries(
      Object.entries(groups).map(([key, groupRows]) => [
        key,
        groupRows.map((row) => {
          const kind = deriveQuoteDetailKind(row);
          const card =
            kind === QUOTE_DETAIL_KIND_REQUEST
              ? mapQuoteRequestCard(row, nowMs)
              : mapSentQuoteCard(row);
          return { ...card, kind };
        }),
      ]),
    );
    return {
      quoteGroups: mappedGroups,
      totalQuotesCount: Object.values(mappedGroups).reduce(
        (total, groupRows) => total + groupRows.length,
        0,
      ),
    };
  }, [listQ.data]);

  const businessError = businessQ.isError
    ? (businessQ.error?.message ?? 'Could not load business')
    : null;
  const listError = listQ.isError ? (listQ.error?.message ?? 'Could not load quotes') : null;

  const isPendingBusiness = Boolean(userId) && businessQ.isPending;
  const isPendingList = hasBusinessRow && listQ.isPending;
  const isLoading = isPendingBusiness || isPendingList;
  const isFetching = businessQ.isFetching || listQ.isFetching;

  const refetch = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: QUOTES_QUERY_ROOT });
    if (userId) {
      await queryClient.refetchQueries({
        queryKey: homeBusinessProfileQueryKey(userId),
      });
    }
  }, [queryClient, userId]);

  return {
    business,
    businessError,
    listError,
    quoteGroups,
    totalQuotesCount,
    acceptQuoteRequests,
    acceptQuoteRequestsSaving,
    acceptQuoteRequestsError,
    persistAcceptQuoteRequests,
    isPendingBusiness,
    isPendingList,
    isLoading,
    isFetching,
    refetch,
  };
}
