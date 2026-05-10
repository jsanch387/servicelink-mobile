import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';

function newRealtimeInstanceId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Keeps React Query notification caches fresh when `notifications` rows change (Realtime).
 *
 * Channel topic includes a per-mount id so we never reuse a topic that is still subscribed
 * (avoids "cannot add postgres_changes callbacks … after subscribe()" on remount / Strict Mode).
 *
 * @param {string | null | undefined} userId
 */
export function useNotificationsRealtime(userId) {
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    const instanceId = newRealtimeInstanceId();
    const channelName = `notifications-realtime:${userId}:${instanceId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClientRef.current.invalidateQueries({ queryKey: ['notifications'] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);
}
