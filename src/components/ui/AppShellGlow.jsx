import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

const GLOW_HEIGHT = 260;

/**
 * Top-edge highlight behind shell screens.
 * The slot is taken out of layout (absolute, zero height) so the gradient cannot
 * push the business name or the launch logo down.
 */
export function AppShellGlow() {
  return (
    <View collapsable={false} pointerEvents="none" style={slotStyle}>
      <View pointerEvents="none" style={glowStyle}>
        <LinearGradient
          colors={['rgba(255,255,255,0.14)', 'rgba(198,198,198,0.08)', 'rgba(10,10,10,0)']}
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          style={gradientStyle}
        />
      </View>
    </View>
  );
}

const slotStyle = {
  height: 0,
  left: 0,
  overflow: 'visible',
  position: 'absolute',
  right: 0,
  top: 0,
  zIndex: 0,
};

const glowStyle = {
  height: GLOW_HEIGHT,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
};

const gradientStyle = {
  flex: 1,
};
