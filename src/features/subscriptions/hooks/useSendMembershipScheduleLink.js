import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '../../auth';
import { postSendMembershipScheduleLink } from '../api/postSendMembershipScheduleLink';
import { membershipCatalogQueryKey } from '../queryKeys';
import {
  MEMBERSHIP_SCHEDULE_LINK_COOLDOWN_MESSAGE,
  createMembershipScheduleLinkGuard,
} from '../utils/scheduleLinkCooldown';

/**
 * Send the public visit schedule link for a subscriber who needs a visit.
 * In-flight + cooldown guards stop a second tap from hitting the server.
 *
 * @param {{ businessId?: string | null }} [args]
 */
export function useSendMembershipScheduleLink({ businessId } = {}) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token ?? null;
  const bid = businessId ?? null;
  const guard = useMemo(() => createMembershipScheduleLinkGuard(), []);

  const mutation = useMutation({
    mutationFn: async (subscriberId) => {
      const result = await postSendMembershipScheduleLink(accessToken, subscriberId);
      if (!result.ok) {
        throw Object.assign(result.error, {
          httpStatus: result.httpStatus,
          retryAfterSec: result.retryAfterSec,
          gate: result.gate,
        });
      }
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: membershipCatalogQueryKey(bid) });
    },
  });

  return {
    sendScheduleLink: async (subscriberId) => {
      const id = String(subscriberId ?? '').trim();
      const gate = guard.begin(id);
      if (!gate.ok) {
        throw Object.assign(gate.error, {
          httpStatus: gate.httpStatus,
          retryAfterSec: gate.retryAfterSec,
        });
      }
      try {
        const result = await mutation.mutateAsync(id);
        guard.succeed(id);
        return result;
      } catch (error) {
        guard.fail(id, {
          httpStatus: Number(error?.httpStatus) || 0,
          retryAfterSec: error?.retryAfterSec,
        });
        const status = Number(error?.httpStatus) || 0;
        if (status === 429 && !String(error?.message ?? '').trim()) {
          throw Object.assign(new Error(MEMBERSHIP_SCHEDULE_LINK_COOLDOWN_MESSAGE), {
            httpStatus: 429,
            retryAfterSec: error?.retryAfterSec,
          });
        }
        throw error;
      }
    },
    isSending: mutation.isPending,
  };
}
