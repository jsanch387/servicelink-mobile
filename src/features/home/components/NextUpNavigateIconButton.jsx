import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme';

/**
 * Compact maps affordance for the Next Up card en-route state.
 *
 * @param {{ canMaps: boolean; onPress: () => void; testID?: string }} props
 */
export function NextUpNavigateIconButton({ canMaps, onPress, testID }) {
  const { colors } = useTheme();
  const lightFace = String(colors.nextUpSurface ?? '').toLowerCase() === '#ffffff';
  const iconColor = lightFace ? '#0a0a0a' : '#fafafa';

  return (
    <Pressable
      accessibilityHint={canMaps ? 'Opens directions in maps' : 'Address required on this booking'}
      accessibilityLabel="Navigate"
      accessibilityRole="button"
      accessibilityState={{ disabled: !canMaps }}
      disabled={!canMaps}
      hitSlop={8}
      style={({ pressed }) => [
        styles.pressable,
        {
          opacity: canMaps ? 1 : 0.45,
          transform: [{ scale: pressed && canMaps ? 0.94 : 1 }],
        },
      ]}
      testID={testID}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.face,
            lightFace ? styles.faceLight : styles.faceDark,
            pressed && canMaps
              ? lightFace
                ? styles.faceLightPressed
                : styles.faceDarkPressed
              : null,
          ]}
        >
          <Ionicons color={iconColor} name="navigate" size={21} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 13,
  },
  face: {
    alignItems: 'center',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  faceLight: {
    backgroundColor: '#f4f4f5',
  },
  faceLightPressed: {
    backgroundColor: '#e4e4e7',
  },
  faceDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  faceDarkPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
});
