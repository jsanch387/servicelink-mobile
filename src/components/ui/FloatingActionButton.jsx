import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Vibration, View } from 'react-native';
import { SCREEN_GUTTER } from '../../constants/layout';
import { useTheme } from '../../theme';

const FAB_SIZE = 56;

/**
 * Shared floating action button for screens that use a single bottom-right FAB.
 *
 * Placement notes:
 * - Use `bottom={30}` to match Home/Customers placement baseline.
 * - Parent screen container should be `position: 'relative'`.
 * - Scroll content should add bottom padding (e.g. `28 + Math.max(tabBarHeight, 72)`).
 */
export function FloatingActionButton({
  onPress,
  bottom = 30,
  accessibilityLabel,
  accessibilityHint,
  iconName,
  badgeIconName = 'add',
  showBadge = true,
}) {
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
          right: SCREEN_GUTTER,
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
        iconCluster: {
          alignItems: 'center',
          height: 34,
          justifyContent: 'center',
          position: 'relative',
          width: 34,
        },
        plusBadge: {
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 9,
          bottom: -2,
          height: 18,
          justifyContent: 'center',
          position: 'absolute',
          right: -4,
          width: 18,
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
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        style={styles.fabPress}
        onPress={handlePress}
        onPressIn={() => animateTo(1.08)}
        onPressOut={() => animateTo(1)}
      >
        <View style={styles.iconCluster}>
          {showBadge ? (
            <>
              <Ionicons color={colors.surface} name={iconName} size={24} />
              <View style={styles.plusBadge}>
                <Ionicons color={colors.accent} name={badgeIconName} size={14} />
              </View>
            </>
          ) : (
            <Ionicons color={colors.surface} name={iconName} size={28} />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
