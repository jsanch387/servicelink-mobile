import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

/**
 * Decorative layers behind launch content — gradients only (no blur native module).
 * `useTheme` is imported from `ThemeContext` directly to avoid a require cycle with `theme/index.js`.
 */
export function AppLaunchAtmosphere() {
  const { isDark } = useTheme();

  const streakA = isDark
    ? ['rgba(255,255,255,0.085)', 'rgba(255,255,255,0)', 'rgba(10,10,10,0)']
    : ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)', 'rgba(245,245,245,0)'];

  const streakB = isDark
    ? ['rgba(10,10,10,0)', 'rgba(200,210,230,0.06)', 'rgba(10,10,10,0)']
    : ['rgba(245,245,245,0)', 'rgba(0,0,0,0.035)', 'rgba(245,245,245,0)'];

  const horizon = isDark
    ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0.045)', 'rgba(255,255,255,0)']
    : ['rgba(0,0,0,0)', 'rgba(0,0,0,0.028)', 'rgba(0,0,0,0)'];

  const vignette = isDark
    ? ['transparent', 'rgba(0,0,0,0.52)']
    : ['transparent', 'rgba(0,0,0,0.07)'];

  /** Soft vertical “mist” in place of BlurView — avoids ExpoBlur dev-client warnings. */
  const mist = isDark
    ? ['rgba(10,10,10,0)', 'rgba(22,22,26,0.28)', 'rgba(10,10,10,0)']
    : ['rgba(245,245,245,0)', 'rgba(255,255,255,0.4)', 'rgba(245,245,245,0)'];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={streakA}
        end={{ x: 0.92, y: 0.65 }}
        locations={[0, 0.38, 1]}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={streakB}
        end={{ x: 0.15, y: 0 }}
        locations={[0, 0.5, 1]}
        start={{ x: 1, y: 0.85 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={horizon}
        end={{ x: 0, y: 0.42 }}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0.28 }}
        style={styles.horizonBand}
      />
      <LinearGradient colors={vignette} locations={[0.35, 1]} style={styles.vignette} />
      <LinearGradient
        colors={mist}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        style={styles.mistVeil}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  horizonBand: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  vignette: {
    bottom: 0,
    height: '58%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  mistVeil: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
});
