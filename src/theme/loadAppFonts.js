import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { loadAsync } from 'expo-font';
import { useEffect, useState } from 'react';

/** Single map passed to `loadAsync` — keys become valid `fontFamily` names. */
export const APP_FONT_MAP = {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
};

/**
 * Waits until fonts are actually registered (unlike `useFonts` on native when `window` is undefined).
 * @returns {[boolean, Error | null]}
 */
export function useLoadAppFonts() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(/** @type {Error | null} */ (null));

  useEffect(() => {
    let cancelled = false;
    loadAsync(APP_FONT_MAP)
      .then(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return [loaded, error];
}
