import { useEffect, useState } from 'react';

const DEFAULT_INTERVAL_MS = 1400;

/**
 * Cycles through submit status messages while `active`.
 *
 * @param {boolean} active
 * @param {string[]} messages
 * @param {number} [intervalMs]
 * @returns {string}
 */
export function useCyclingSubmitStatusMessage(active, messages, intervalMs = DEFAULT_INTERVAL_MS) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return undefined;
    }
    if (messages.length <= 1) {
      setIndex(0);
      return undefined;
    }
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, messages]);

  return messages[index] ?? messages[0] ?? '';
}
