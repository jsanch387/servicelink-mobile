import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import {
  fetchActiveQuoteLinkExpiry,
  fetchQuoteByIdForBusiness,
  fetchQuotesForBusiness,
} from '../api/quotes';
import {
  QUOTE_DETAIL_LOAD_FAILED_USER_MESSAGE,
  QUOTE_DETAIL_NOT_FOUND_USER_MESSAGE,
} from '../constants';
import { QUOTES_QUERY_ROOT, quoteDetailQueryKey, quotesListQueryKey } from '../queryKeys';
import { deriveQuoteDetailKind, mapQuoteDetailModel } from '../utils/quotePresentation';
import { quotesDebugError, quotesFormatSupabaseError } from '../utils/quotesDebug';

/**
 * @param {string | undefined} quoteId
 */
export function useQuoteDetail(quoteId) {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      if (!quoteId) return;
      void queryClient.refetchQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === 'quotes' &&
          q.queryKey[1] === 'detail' &&
          q.queryKey[3] === quoteId,
        type: 'active',
        stale: true,
      });
    }, [queryClient, quoteId]),
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

  const businessId = businessQ.data?.id;
  const hasBusinessRow = Boolean(businessId);

  const detailQ = useQuery({
    queryKey: quoteDetailQueryKey(businessId, quoteId),
    queryFn: async () => {
      const idNorm = String(quoteId ?? '').trim();

      const { data: row, error } = await fetchQuoteByIdForBusiness(businessId, idNorm);
      if (error) {
        quotesDebugError(
          'useQuoteDetail:detailQuery:quote-fetch-throw',
          error.message ?? 'unknown',
          {
            businessId,
            quoteId: idNorm,
            formatted: quotesFormatSupabaseError(error),
          },
        );
        throw new Error(QUOTE_DETAIL_LOAD_FAILED_USER_MESSAGE);
      }

      let resolvedRow = row;
      if (!resolvedRow) {
        const listRows = await queryClient.fetchQuery({
          queryKey: quotesListQueryKey(businessId),
          queryFn: async () => {
            const res = await fetchQuotesForBusiness(businessId);
            if (res.error) {
              throw new Error(QUOTE_DETAIL_LOAD_FAILED_USER_MESSAGE);
            }
            return res.data ?? [];
          },
        });
        resolvedRow = listRows.find((r) => String(r?.id) === idNorm) ?? null;
      }

      if (!resolvedRow) {
        quotesDebugError('useQuoteDetail:detailQuery:not-found', 'Quote not found', {
          businessId,
          quoteId: idNorm,
        });
        throw new Error(QUOTE_DETAIL_NOT_FOUND_USER_MESSAGE);
      }

      const linkResult = await fetchActiveQuoteLinkExpiry(idNorm);
      const activeLinkExpiresAt =
        !linkResult.error && linkResult.data?.expires_at != null
          ? linkResult.data.expires_at
          : null;

      const kind = deriveQuoteDetailKind(resolvedRow);
      const model = mapQuoteDetailModel(resolvedRow, kind, {
        activeLinkExpiresAt,
      });

      return { row: resolvedRow, kind, model };
    },
    enabled: Boolean(quoteId && hasBusinessRow),
    staleTime: 30 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const payload = detailQ.data ?? null;

  const businessError = businessQ.isError
    ? (businessQ.error?.message ?? 'Could not load business')
    : null;
  const detailError = detailQ.isError ? (detailQ.error?.message ?? 'Could not load quote') : null;

  const isPendingBusiness = Boolean(userId) && businessQ.isPending;
  const isPendingDetail = Boolean(quoteId && hasBusinessRow) && detailQ.isPending;
  const isLoading = isPendingBusiness || isPendingDetail;

  const refetch = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: QUOTES_QUERY_ROOT });
    if (userId) {
      await queryClient.refetchQueries({ queryKey: homeBusinessProfileQueryKey(userId) });
    }
    if (businessId && quoteId) {
      await queryClient.refetchQueries({
        queryKey: quoteDetailQueryKey(businessId, quoteId),
      });
    }
  }, [queryClient, userId, businessId, quoteId]);

  return useMemo(
    () => ({
      businessId: businessId ?? null,
      kind: payload?.kind ?? null,
      model: payload?.model ?? null,
      businessError,
      detailError,
      isLoading,
      isFetching: businessQ.isFetching || detailQ.isFetching,
      refetch,
    }),
    [
      businessId,
      payload?.kind,
      payload?.model,
      businessError,
      detailError,
      isLoading,
      businessQ.isFetching,
      detailQ.isFetching,
      refetch,
    ],
  );
}
