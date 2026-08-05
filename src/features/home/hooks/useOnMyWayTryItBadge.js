import { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { markOnMyWayTryItSeen, readOnMyWayTryItSeen } from '../storage/nextUpOnMyWayTryItStorage';

export const NEXT_UP_ON_MY_WAY_TRY_IT_DEV_RESET_EVENT = 'servicelink.nextUp.onMyWayTryIt.devReset';

/**
 * Launch “Try it” pill on On my way — once per device.
 *
 * @param {{ enabled?: boolean }} args
 */
export function useOnMyWayTryItBadge({ enabled = false } = {}) {
  const [seen, setSeen] = useState(true);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const value = await readOnMyWayTryItSeen();
    setSeen(value);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setReady(true);
      setSeen(true);
      return undefined;
    }
    void refresh();
    return undefined;
  }, [enabled, refresh]);

  useEffect(() => {
    if (typeof __DEV__ === 'undefined' || !__DEV__) {
      return undefined;
    }
    const sub = DeviceEventEmitter.addListener(NEXT_UP_ON_MY_WAY_TRY_IT_DEV_RESET_EVENT, () => {
      void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const markSeen = useCallback(async () => {
    setSeen(true);
    await markOnMyWayTryItSeen();
  }, []);

  /**
   * Persist “seen” for future sessions without hiding the pill in this session.
   */
  const markSeenForNextTime = useCallback(async () => {
    await markOnMyWayTryItSeen();
  }, []);

  return {
    showBadge: enabled && ready && !seen,
    markSeen,
    markSeenForNextTime,
    ready,
  };
}
