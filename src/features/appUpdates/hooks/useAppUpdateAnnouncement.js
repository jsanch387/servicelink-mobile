import { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { APP_UPDATE_ANNOUNCEMENTS } from '../constants/announcements';
import { APP_UPDATES_DEV_RESET_EVENT } from '../dev/resetAppUpdatesForDev';
import { markAnnouncementSeen, readSeenAnnouncementIds } from '../storage/seenAnnouncements';
import { getPendingAnnouncements } from '../utils/getPendingAnnouncements';

export function useAppUpdateAnnouncement() {
  const [pending, setPending] = useState(
    /** @type {import('../constants/announcements').WhatsNewAnnouncement[]} */ ([]),
  );
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(async () => {
    const seenIds = await readSeenAnnouncementIds();
    setPending(getPendingAnnouncements(APP_UPDATE_ANNOUNCEMENTS, seenIds));
    setIsReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof __DEV__ === 'undefined' || !__DEV__) {
      return undefined;
    }
    const sub = DeviceEventEmitter.addListener(APP_UPDATES_DEV_RESET_EVENT, () => {
      void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const current = pending[0] ?? null;

  const dismissCurrent = useCallback(async () => {
    if (!current?.id) {
      return;
    }
    await markAnnouncementSeen(current.id);
    setPending((prev) => prev.filter((entry) => entry.id !== current.id));
  }, [current?.id]);

  return {
    announcement: current,
    hasAnnouncement: Boolean(current),
    isReady,
    dismissCurrent,
    refresh,
  };
}
