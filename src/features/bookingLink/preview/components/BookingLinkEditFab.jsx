import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Vibration } from 'react-native';
import { useTheme } from '../../../../theme';

const FAB_SIZE = 56;

/**
 * Same layout pattern as {@link ../../../home/components/FloatingCreateMenu}: `Animated.View`
 * + absolute `bottom` / `right`, sibling of a `flex:1` `ScrollView` inside a `flex:1` parent.
 * Single action: enter booking-link edit mode.
 */
export function BookingLinkEditFab({ onPress, bottom = 30 }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const vibrateSoft = useCallback(() => {
    Haptics.selectionAsync().catch(() => {
      Vibration.vibrate(6);
    });
  }, []);

  const handlePress = useCallback(() => {
    vibrateSoft();
    onPress?.();
  }, [onPress, vibrateSoft]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        fab: {
          alignItems: 'center',
          backgroundColor: colors.accent,
          borderRadius: 28,
          bottom,
          height: FAB_SIZE,
          justifyContent: 'center',
          position: 'absolute',
          right: 20,
          width: FAB_SIZE,
          zIndex: 30,
        },
        fabPress: {
          alignItems: 'center',
          borderRadius: 28,
          height: FAB_SIZE,
          justifyContent: 'center',
          width: FAB_SIZE,
        },
      }),
    [bottom, colors],
  );

  function animateTo(value) {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  }

  return (
    <Animated.View style={[styles.fab, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityHint="Opens the editor for your public booking page"
        accessibilityLabel="Edit booking link"
        accessibilityRole="button"
        style={styles.fabPress}
        onPress={handlePress}
        onPressIn={() => animateTo(1.08)}
        onPressOut={() => animateTo(1)}
      >
        <Ionicons color={colors.surface} name="create-outline" size={28} />
      </Pressable>
    </Animated.View>
  );
}
