import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppText } from '../../../components/ui';
import { formatElapsedJobClock } from './formatElapsedJobClock';

/**
 * Small in-app count-up so the owner can see elapsed time while the app is open
 * (the Dynamic Island is hidden in the foreground).
 */
export function ElapsedJobTimer({ startedAtMs, color }) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!Number.isFinite(startedAtMs) || startedAtMs <= 0) {
      return undefined;
    }
    const tick = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(tick);
  }, [startedAtMs]);

  if (!Number.isFinite(startedAtMs) || startedAtMs <= 0) {
    return null;
  }

  return (
    <View style={styles.host}>
      <AppText
        accessibilityLabel="Job elapsed time"
        numberOfLines={1}
        style={[styles.clock, color ? { color } : null]}
      >
        {formatElapsedJobClock(nowMs - startedAtMs)}
      </AppText>
    </View>
  );
}

const styles = {
  host: {
    flexShrink: 0,
    justifyContent: 'center',
  },
  clock: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 16,
  },
};
