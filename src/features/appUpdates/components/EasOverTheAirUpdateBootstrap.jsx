import { useEffect } from 'react';
import { AppState } from 'react-native';
import { checkAndApplyEasUpdate } from '../utils/checkAndApplyEasUpdate';

/** Fetches and applies EAS Update bundles on launch and when returning to foreground. */
export function EasOverTheAirUpdateBootstrap() {
  useEffect(() => {
    void checkAndApplyEasUpdate();

    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void checkAndApplyEasUpdate();
      }
    });

    return () => sub.remove();
  }, []);

  return null;
}
