import { useCallback, useEffect, useMemo, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { NEXT_UP_COACH_TIPS, resolveNextUpCoachTipId } from '../constants/nextUpCoachTips';
import {
  markNextUpCoachTipSeen,
  readSeenNextUpCoachTipIds,
} from '../storage/nextUpCoachTipStorage';

export const NEXT_UP_COACH_TIPS_DEV_RESET_EVENT = 'servicelink.nextUp.coachTips.devReset';

/**
 * Progressive coach tip for the CTA currently on Next Up.
 *
 * @param {{
 *   enabled?: boolean;
 *   actionMode: 'upcoming' | 'en_route' | 'working' | 'complete';
 *   workingPhase?: 'handoff' | 'ready' | null;
 * }} args
 */
export function useNextUpCoachTip({ enabled = false, actionMode, workingPhase = null }) {
  const [seenIds, setSeenIds] = useState(/** @type {string[]} */ ([]));
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(async () => {
    const ids = await readSeenNextUpCoachTipIds();
    setSeenIds(ids);
    setIsReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof __DEV__ === 'undefined' || !__DEV__) {
      return undefined;
    }
    const sub = DeviceEventEmitter.addListener(NEXT_UP_COACH_TIPS_DEV_RESET_EVENT, () => {
      void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const tipId = useMemo(() => {
    if (!enabled) {
      return null;
    }
    return resolveNextUpCoachTipId(actionMode, workingPhase);
  }, [actionMode, enabled, workingPhase]);

  const tip = useMemo(() => {
    if (!isReady || !tipId || seenIds.includes(tipId)) {
      return null;
    }
    return NEXT_UP_COACH_TIPS[tipId] ?? null;
  }, [isReady, seenIds, tipId]);

  const dismissTip = useCallback(async () => {
    if (!tipId) {
      return;
    }
    await markNextUpCoachTipSeen(tipId);
    setSeenIds((prev) => (prev.includes(tipId) ? prev : [...prev, tipId]));
  }, [tipId]);

  return {
    tip,
    isReady,
    dismissTip,
  };
}
