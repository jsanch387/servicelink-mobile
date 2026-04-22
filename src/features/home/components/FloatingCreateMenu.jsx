import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { useTheme } from '../../../theme';

const MENU_ITEMS = [
  {
    key: 'appointment',
    icon: 'calendar-outline',
    label: 'Create appointment',
  },
  {
    key: 'quote',
    icon: 'document-text-outline',
    label: 'Create quote',
  },
];

/**
 * Floating create FAB with a compact action menu.
 * Includes subtle spring/opacity animation + tactile vibration feedback.
 */
export function FloatingCreateMenu({ onCreateAppointment, onCreateQuote, bottom = 30 }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? 220 : 180,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  const vibrateSoft = useCallback(() => {
    // Tiny, crisp tactile tap on both iOS/Android.
    Haptics.selectionAsync().catch(() => {
      Vibration.vibrate(6);
    });
  }, []);

  const toggleMenu = useCallback(() => {
    vibrateSoft();
    setOpen((prev) => !prev);
  }, [vibrateSoft]);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSelect = useCallback(
    (key) => {
      vibrateSoft();
      closeMenu();
      if (key === 'appointment') {
        onCreateAppointment?.();
        return;
      }
      onCreateQuote?.();
    },
    [closeMenu, onCreateAppointment, onCreateQuote, vibrateSoft],
  );

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
        actionListWrap: {
          alignItems: 'flex-end',
          bottom: bottom + 72,
          position: 'absolute',
          right: 20,
        },
        actionSheet: {
          backgroundColor: colors.surface,
          borderColor: colors.borderStrong,
          borderRadius: 18,
          borderWidth: 1,
          padding: 8,
          width: 236,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 16,
        },
        optionButton: {
          backgroundColor: colors.shellElevated,
          borderRadius: 12,
          height: 52,
          justifyContent: 'center',
          paddingHorizontal: 12,
          width: '100%',
        },
        optionRow: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        optionGap: {
          height: 8,
        },
        optionPressed: {
          backgroundColor: colors.cardSurface,
        },
        optionIconWrap: {
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 14,
          height: 28,
          justifyContent: 'center',
          marginRight: 10,
          width: 28,
        },
        labelWrap: {
          flex: 1,
          minWidth: 0,
          paddingRight: 8,
        },
        optionLabel: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
        },
        optionChevronWrap: {
          alignItems: 'flex-end',
          justifyContent: 'center',
          width: 18,
        },
        fab: {
          alignItems: 'center',
          backgroundColor: colors.accent,
          borderRadius: 28,
          bottom,
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
    [bottom, colors],
  );

  const menuOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const menuTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
  const menuScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });
  const fabScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.96],
  });
  const iconRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      {open ? (
        <View pointerEvents="auto" style={styles.overlay}>
          <Pressable
            accessibilityLabel="Close create menu"
            accessibilityRole="button"
            style={styles.backdrop}
            onPress={closeMenu}
          />
          <Animated.View
            style={[
              styles.actionListWrap,
              {
                opacity: menuOpacity,
                transform: [{ translateY: menuTranslateY }, { scale: menuScale }],
              },
            ]}
          >
            <View style={styles.actionSheet}>
              {MENU_ITEMS.map((item, idx) => (
                <View key={item.key}>
                  <Pressable
                    accessibilityLabel={item.label}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.optionButton, pressed && styles.optionPressed]}
                    onPress={() => handleSelect(item.key)}
                  >
                    <View style={styles.optionRow}>
                      <View style={styles.optionIconWrap}>
                        <Ionicons color={colors.textMuted} name={item.icon} size={16} />
                      </View>
                      <View style={styles.labelWrap}>
                        <Text allowFontScaling={false} numberOfLines={1} style={styles.optionLabel}>
                          {item.label}
                        </Text>
                      </View>
                      <View style={styles.optionChevronWrap}>
                        <Ionicons color={colors.textMuted} name="chevron-forward" size={17} />
                      </View>
                    </View>
                  </Pressable>
                  {idx < MENU_ITEMS.length - 1 ? <View style={styles.optionGap} /> : null}
                </View>
              ))}
            </View>
          </Animated.View>
        </View>
      ) : null}

      <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
        <Pressable
          accessibilityLabel="Create"
          accessibilityRole="button"
          style={styles.fabPress}
          onPress={toggleMenu}
        >
          <Animated.View style={{ transform: [{ rotate: iconRotate }] }}>
            <Ionicons color={colors.surface} name="add" size={28} />
          </Animated.View>
        </Pressable>
      </Animated.View>
    </>
  );
}
