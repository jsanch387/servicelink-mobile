import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../../theme';

const BOTTOM = 30;
const FAB_SIZE = 56;
const ACTION_GAP = 10;
const ROW_GAP = 12;

const MENU_ITEMS = [
  {
    key: 'edit',
    icon: 'create-outline',
    label: 'Edit profile',
  },
];

/**
 * Speed-dial style FAB: opens a vertical stack of actions; main control shows + / ×.
 */
export function EditProfileFab({ onPress }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? 220 : 180,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  const vibrateSoft = useCallback(async () => {
    try {
      await Haptics.selectionAsync();
    } catch {
      // no-op when haptics unavailable
    }
  }, []);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    vibrateSoft();
    setOpen((prev) => !prev);
  }, [vibrateSoft]);

  const handleSelectEdit = useCallback(() => {
    vibrateSoft();
    closeMenu();
    onPress?.();
  }, [closeMenu, onPress, vibrateSoft]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          ...StyleSheet.absoluteFillObject,
          zIndex: 20,
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.28)',
        },
        actionColumn: {
          alignItems: 'flex-end',
          bottom: BOTTOM + FAB_SIZE + ACTION_GAP,
          gap: ROW_GAP,
          position: 'absolute',
          right: 20,
          zIndex: 21,
        },
        actionRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
        },
        labelPill: {
          backgroundColor: colors.surface,
          borderColor: colors.borderStrong,
          borderRadius: 999,
          borderWidth: 1,
          maxWidth: 220,
          paddingHorizontal: 14,
          paddingVertical: 9,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 3,
        },
        labelText: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '600',
        },
        actionIconOuter: {
          alignItems: 'center',
          backgroundColor: colors.accent,
          borderRadius: 24,
          height: 48,
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
          width: 48,
        },
        fab: {
          alignItems: 'center',
          backgroundColor: colors.accent,
          borderRadius: 28,
          bottom: BOTTOM,
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
    [colors],
  );

  const menuOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const menuTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });
  const menuScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });
  const fabScaleAnim = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.98],
  });

  function animateTo(value) {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  }

  return (
    <>
      {open ? (
        <View pointerEvents="box-none" style={styles.overlay}>
          <Pressable
            accessibilityLabel="Close profile actions"
            accessibilityRole="button"
            style={styles.backdrop}
            onPress={closeMenu}
          />
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.actionColumn,
              {
                opacity: menuOpacity,
                transform: [{ translateY: menuTranslateY }, { scale: menuScale }],
              },
            ]}
          >
            {MENU_ITEMS.map((item) => (
              <View key={item.key} style={styles.actionRow}>
                <View style={styles.labelPill}>
                  <Text allowFontScaling={false} numberOfLines={1} style={styles.labelText}>
                    {item.label}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                  style={styles.actionIconOuter}
                  onPress={handleSelectEdit}
                >
                  <Ionicons color={colors.surface} name={item.icon} size={22} />
                </Pressable>
              </View>
            ))}
          </Animated.View>
        </View>
      ) : null}

      <Animated.View
        style={[
          styles.fab,
          {
            transform: [{ scale: fabScaleAnim }, { scale }],
          },
        ]}
      >
        <Pressable
          accessibilityLabel={open ? 'Close profile actions' : 'Open profile actions'}
          accessibilityRole="button"
          style={styles.fabPress}
          onPress={toggleMenu}
          onPressIn={() => animateTo(1.08)}
          onPressOut={() => animateTo(1)}
        >
          <Ionicons color={colors.surface} name={open ? 'close' : 'add'} size={28} />
        </Pressable>
      </Animated.View>
    </>
  );
}
