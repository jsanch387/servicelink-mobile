import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme';

/**
 * Compact maps affordance for the Next Up card en-route state.
 * Always tappable — caller shows an alert when the booking has no address.
 *
 * @param {{ onPress: () => void; testID?: string }} props
 */
export function NextUpNavigateIconButton({ onPress, testID }) {
  const { colors } = useTheme();
  const lightFace = String(colors.nextUpSurface ?? '').toLowerCase() === '#ffffff';
  const iconColor = lightFace ? '#0a0a0a' : '#fafafa';

  return (
    <Pressable
      accessibilityHint="Opens directions in maps"
      accessibilityLabel="Navigate"
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => [
        styles.pressable,
        {
          transform: [{ scale: pressed ? 0.94 : 1 }],
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
            pressed ? (lightFace ? styles.faceLightPressed : styles.faceDarkPressed) : null,
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
