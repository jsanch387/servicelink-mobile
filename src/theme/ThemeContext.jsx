import { createContext, useContext, useMemo, useState } from 'react';
import { themes } from './themes';

/** @typedef {'light' | 'dark'} ColorScheme */

const ThemeContext = createContext(undefined);

/**
 * @param {{ children: import('react').ReactNode; initialScheme?: ColorScheme }} props
 */
export function ThemeProvider({ children, initialScheme = 'dark' }) {
  const [scheme, setScheme] = useState(
    /** @type {ColorScheme} */ (initialScheme),
  );

  const value = useMemo(() => {
    const colors = themes[scheme];
    return {
      scheme,
      /** Switch app theme — persist here later (e.g. AsyncStorage) if you want it remembered */
      setScheme,
      colors,
      isDark: scheme === 'dark',
    };
  }, [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
