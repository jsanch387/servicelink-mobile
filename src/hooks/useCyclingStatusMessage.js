import { useEffect, useState } from 'react';

const DEFAULT_INTERVAL_MS = 3000;

/**
 * Advances through status messages while active.
 * By default holds on the final message; pass `loop: true` to rotate continuously.
 *
 * @param {boolean} active
 * @param {string[]} messages
 * @param {number} [intervalMs]
 * @param {{ loop?: boolean }} [options]
 * @returns {string}
 */
export function useCyclingStatusMessage(
  active,
  messages,
  intervalMs = DEFAULT_INTERVAL_MS,
  options = {},
) {
  const loop = Boolean(options.loop);
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
      setIndex((current) => {
        if (loop) {
          return (current + 1) % messages.length;
        }
        return Math.min(current + 1, messages.length - 1);
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, loop, messages]);

  return messages[index] ?? messages[0] ?? '';
}
