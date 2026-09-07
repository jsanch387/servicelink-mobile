import { useEffect, useState } from 'react';
import { readJobLiveActivityStartedAt } from './jobLiveActivity';

/**
 * @param {string | null | undefined} bookingId
 * @returns {number | null}
 */
export function useJobLiveActivityStartedAt(bookingId) {
  const [startedAtMs, setStartedAtMs] = useState(null);
  const id = String(bookingId ?? '').trim();

  useEffect(() => {
    if (!id) {
      setStartedAtMs(null);
      return undefined;
    }
    let cancelled = false;
    void readJobLiveActivityStartedAt(id).then((ms) => {
      if (!cancelled) {
        setStartedAtMs(ms);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return startedAtMs;
}
