import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { applyMembershipRealtimeRow } from '../../home/api/homeDashboard';
import { activeBusinessMembershipQueryKey } from '../queryKeys';

function newRealtimeInstanceId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Kicks or restores a hire as soon as `business_members` changes for this user.
 *
 * @param {string | null | undefined} userId
 */
export function useTeamMembershipRealtime(userId) {
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    const instanceId = newRealtimeInstanceId();
    const queryKey = activeBusinessMembershipQueryKey(userId);

    const applyPayload = (payload) => {
      const eventType = payload?.eventType ?? payload?.event;
      const row = payload?.new?.business_id ? payload.new : payload?.old;
      queryClientRef.current.setQueryData(queryKey, (current) =>
        applyMembershipRealtimeRow(current, row, eventType),
      );
      void queryClientRef.current.invalidateQueries({ queryKey });
    };

    const channel = supabase
      .channel(`team-membership:${userId}:${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_members',
          filter: `user_id=eq.${userId}`,
        },
        applyPayload,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);
}
