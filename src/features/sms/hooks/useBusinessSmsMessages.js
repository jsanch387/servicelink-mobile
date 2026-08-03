import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { SMS_MESSAGES_PAGE_SIZE, fetchBusinessSmsMessages } from '../api/fetchBusinessSmsMessages';
import { SENT_TEXTS_DESIGN_PREVIEW } from '../constants/sentTextsDesignPreview';
import { SMS_QUERY_ROOT, businessSmsMessagesQueryKey } from '../queryKeys';
import {
  buildSentTextsDesignPreviewItems,
  mapSmsMessageRowToTimelineItem,
} from '../utils/smsMessagePresentation';

export function useBusinessSmsMessages() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      void queryClient.refetchQueries({
        queryKey: SMS_QUERY_ROOT,
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

  const listQ = useInfiniteQuery({
    queryKey: businessSmsMessagesQueryKey(businessId),
    queryFn: async ({ pageParam }) => {
      const { data, error } = await fetchBusinessSmsMessages(businessId, {
        offset: pageParam,
        limit: SMS_MESSAGES_PAGE_SIZE,
      });
      if (error) {
        throw error;
      }
      return (data ?? []).map(mapSmsMessageRowToTimelineItem);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < SMS_MESSAGES_PAGE_SIZE) {
        return undefined;
      }
      return allPages.reduce((sum, page) => sum + page.length, 0);
    },
    enabled: hasBusinessRow,
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const liveMessages = useMemo(
    () => (listQ.data?.pages ?? []).flatMap((page) => page),
    [listQ.data?.pages],
  );
  const showingDesignPreview =
    SENT_TEXTS_DESIGN_PREVIEW && hasBusinessRow && listQ.isSuccess && liveMessages.length === 0;

  const messages = useMemo(
    () => (showingDesignPreview ? buildSentTextsDesignPreviewItems() : liveMessages),
    [liveMessages, showingDesignPreview],
  );

  const businessError = businessQ.isError
    ? (businessQ.error?.message ?? 'Could not load business')
    : null;
  const listError = listQ.isError ? (listQ.error?.message ?? 'Could not load sent messages') : null;

  const isPendingBusiness = Boolean(userId) && businessQ.isPending;
  const isPendingList = hasBusinessRow && listQ.isPending;
  const isLoading = isPendingBusiness || isPendingList;
  const isFetching = businessQ.isFetching || listQ.isFetching;
  const hasNextPage = Boolean(listQ.hasNextPage) && !showingDesignPreview;
  const isFetchingNextPage = listQ.isFetchingNextPage;

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    void listQ.fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, listQ]);

  const refetch = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: SMS_QUERY_ROOT });
    if (userId) {
      await queryClient.refetchQueries({
        queryKey: homeBusinessProfileQueryKey(userId),
      });
    }
  }, [queryClient, userId]);

  return {
    business,
    messages,
    showingDesignPreview,
    isLoading,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
    businessError,
    listError,
    refetch,
  };
}
