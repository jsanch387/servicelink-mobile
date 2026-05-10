import { useAuth } from '../../auth';
import { useNotificationsRealtime } from '../hooks/useNotificationsRealtime';

/** Subscribes to Supabase Realtime for `notifications` while the main app tabs are mounted. */
export function NotificationsRealtimeBridge() {
  const { user } = useAuth();
  useNotificationsRealtime(user?.id ?? null);
  return null;
}
