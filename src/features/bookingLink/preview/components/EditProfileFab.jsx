import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../../theme';

export function EditProfileFab({ onPress }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        fab: {
          alignItems: 'center',
          backgroundColor: colors.accent,
          borderRadius: 28,
          bottom: 30,
          height: 56,
          justifyContent: 'center',
          position: 'absolute',
          right: 20,
          width: 56,
          zIndex: 30,
        },
        fabPress: {
          alignItems: 'center',
          borderRadius: 28,
          height: 56,
          justifyContent: 'center',
          width: 56,
        },
      }),
    [colors],
  );

  function animateTo(value) {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  }

  async function handlePress() {
    try {
      await Haptics.selectionAsync();
    } catch {
      // no-op when haptics unavailable
    }
    onPress?.();
  }

  return (
    <Animated.View style={[styles.fab, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityLabel="Edit business profile"
        accessibilityRole="button"
        style={styles.fabPress}
        onPress={handlePress}
        onPressIn={() => animateTo(1.08)}
        onPressOut={() => animateTo(1)}
      >
        <View>
          <Ionicons color={colors.surface} name="create-outline" size={28} />
        </View>
      </Pressable>
    </Animated.View>
  );
}
