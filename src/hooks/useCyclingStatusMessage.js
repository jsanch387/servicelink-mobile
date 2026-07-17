import { useEffect, useState } from 'react';

const DEFAULT_INTERVAL_MS = 3000;

/**
 * Advances through status messages while active, then holds the final message.
 *
 * @param {boolean} active
 * @param {string[]} messages
 * @param {number} [intervalMs]
 * @returns {string}
 */
export function useCyclingStatusMessage(active, messages, intervalMs = DEFAULT_INTERVAL_MS) {
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
      setIndex((current) => Math.min(current + 1, messages.length - 1));
    }, intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, messages]);

  return messages[index] ?? messages[0] ?? '';
}
