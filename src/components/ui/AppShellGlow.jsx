import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

export function AppShellGlow() {
  return (
    <View pointerEvents="none" style={styles.layer}>
      <View style={styles.topGlowLayer}>
        <LinearGradient
          colors={['rgba(255,255,255,0.14)', 'rgba(198,198,198,0.08)', 'rgba(10,10,10,0)']}
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          style={styles.topGlowGradient}
        />
      </View>

      <View style={styles.bottomGlowLayer}>
        <LinearGradient
          colors={['rgba(10,10,10,0)', 'rgba(198,198,198,0.035)', 'rgba(255,255,255,0.06)']}
          locations={[0, 0.62, 1]}
          start={{ x: 0.5, y: 0 }}
          style={styles.bottomGlowGradient}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  topGlowLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    top: 0,
  },
  topGlowGradient: {
    height: 260,
    width: '100%',
  },
  bottomGlowLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bottomGlowGradient: {
    height: 130,
    width: '100%',
  },
});
