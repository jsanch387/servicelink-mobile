import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from './ThemeContext';
import { useLoadAppFonts } from './loadAppFonts';
import { FONT_FAMILIES } from './typographyPresets';

const TypographyContext = createContext(undefined);

const isTestEnv = process.env.NODE_ENV === 'test';

/**
 * Fonts load here; body text uses `AppText` / `AppTextInput` (`fontFamily` from context).
 * We do not use `Text.defaultProps` — it is unreliable with custom fonts in RN.
 *
 * @param {{ children: import('react').ReactNode }} props
 */
export function TypographyProvider({ children }) {
  const { colors } = useTheme();
  const [fontsLoaded, fontError] = useLoadAppFonts();
  const [fontsApplied, setFontsApplied] = useState(isTestEnv);

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }
    setFontsApplied(true);
  }, [fontsLoaded]);

  const value = useMemo(
    () => ({
      fontsLoaded: fontsLoaded && fontsApplied,
      fontLoadError: fontError,
      fontFamily: FONT_FAMILIES,
    }),
    [fontsLoaded, fontsApplied, fontError],
  );

  if (!fontsLoaded || !fontsApplied) {
    return (
      <View
        style={{
          alignItems: 'center',
          backgroundColor: colors.shell,
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <TypographyContext.Provider value={value}>
      <View style={{ flex: 1 }}>{children}</View>
    </TypographyContext.Provider>
  );
}

export function useTypography() {
  const ctx = useContext(TypographyContext);
  if (ctx === undefined) {
    throw new Error('useTypography must be used within TypographyProvider');
  }
  return ctx;
}
