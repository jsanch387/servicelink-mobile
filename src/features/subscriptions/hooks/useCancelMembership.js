import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { useAuth } from '../../auth';
import { postCancelMembership } from '../api/postCancelMembership';
import { membershipCatalogQueryKey } from '../queryKeys';
import { replaceCatalogSubscriber } from '../utils/applyOwnerSubscriberPayload';

/**
 * Cancel a customer membership via the server (period-end or immediate).
 *
 * @param {{ businessId?: string | null }} [args]
 */
export function useCancelMembership({ businessId } = {}) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token ?? null;
  const bid = businessId ?? null;
  const inFlightRef = useRef(false);

  const mutation = useMutation({
    mutationFn: async ({ subscriberId, action }) => {
      const result = await postCancelMembership(accessToken, subscriberId, action);
      if (!result.ok) {
        throw Object.assign(result.error, {
          httpStatus: result.httpStatus,
          gate: result.gate,
        });
      }
      return result;
    },
    onSuccess: async (result, vars) => {
      const key = membershipCatalogQueryKey(bid);
      queryClient.setQueryData(key, (current) =>
        replaceCatalogSubscriber(current, vars.subscriberId, result.subscriber),
      );
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return {
    cancelMembership: async ({ subscriberId, action }) => {
      const id = String(subscriberId ?? '').trim();
      if (!id) {
        throw Object.assign(new Error('Missing subscriber'), { httpStatus: 0 });
      }
      if (inFlightRef.current || mutation.isPending) {
        throw Object.assign(new Error('Cancel is already in progress.'), { httpStatus: 429 });
      }
      inFlightRef.current = true;
      try {
        return await mutation.mutateAsync({ subscriberId: id, action });
      } finally {
        inFlightRef.current = false;
      }
    },
    isCanceling: mutation.isPending,
  };
}
