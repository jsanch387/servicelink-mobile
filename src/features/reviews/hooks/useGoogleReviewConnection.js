import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { getSession } from '../../auth';
import { fetchGoogleReviewConnectionStatus } from '../api/fetchGoogleReviewConnectionStatus';
import { postGoogleReviewConnect } from '../api/postGoogleReviewConnect';
import { GOOGLE_CONNECT_RETURN_ERROR } from '../constants/googleConnectCopy';
import { GOOGLE_REVIEWS_AUTH_RETURN_URL } from '../constants/reviewsApiRoutes';
import { REVIEWS_QUERY_ROOT, reviewsGoogleStatusQueryKey } from '../queryKeys';
import { parseGoogleConnectReturn } from '../utils/parseGoogleConnectReturn';

/**
 * Whether this business already has a Google connection.
 * `connected` stays null until the status call succeeds, so the screen does not invent a link.
 *
 * @param {string | null | undefined} userId
 * @param {{ enabled?: boolean }} [options]
 */
export function useGoogleReviewConnection(userId, { enabled = true } = {}) {
  const queryClient = useQueryClient();
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState(/** @type {string | null} */ (null));
  const query = useQuery({
    queryKey: reviewsGoogleStatusQueryKey(userId),
    queryFn: async () => {
      const { data } = await getSession();
      const result = await fetchGoogleReviewConnectionStatus(data?.session?.access_token);
      if (!result.ok) {
        throw result.error;
      }
      return result.status;
    },
    enabled: Boolean(userId) && enabled,
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const refetch = useCallback(async () => {
    if (!userId || !enabled) return;
    await queryClient.refetchQueries({ queryKey: reviewsGoogleStatusQueryKey(userId) });
  }, [enabled, queryClient, userId]);

  const startConnect = useCallback(async () => {
    if (!userId || !enabled || connectLoading) return;
    setConnectError(null);
    setConnectLoading(true);
    try {
      const { data } = await getSession();
      const started = await postGoogleReviewConnect(data?.session?.access_token);
      if (!started.ok) {
        setConnectError(started.userMessage);
        return;
      }

      const authResult = await WebBrowser.openAuthSessionAsync(
        started.url,
        GOOGLE_REVIEWS_AUTH_RETURN_URL,
      );
      if (authResult?.type !== 'success') return;

      if (parseGoogleConnectReturn(authResult.url) === 'error') {
        setConnectError(GOOGLE_CONNECT_RETURN_ERROR);
      }
      await queryClient.refetchQueries({ queryKey: REVIEWS_QUERY_ROOT });
    } catch {
      setConnectError('Something went wrong. Check your connection and try again.');
    } finally {
      setConnectLoading(false);
    }
  }, [connectLoading, enabled, queryClient, userId]);

  return {
    connected: query.isSuccess ? query.data.connected === true : null,
    connectError,
    connectLoading,
    isLoading: enabled && Boolean(userId) && query.isPending,
    isFetching: query.isFetching,
    refetch,
    startConnect,
  };
}
