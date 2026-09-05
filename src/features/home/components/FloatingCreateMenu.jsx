import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { useCreatePaymentHighlight } from '../../payments/create-payment/hooks/useCreatePaymentHighlight';
import { CreateMenuFabGlow } from './CreateMenuFabGlow';

const FAB_SIZE = 56;
const FAB_RADIUS = 18;
const ACTION_GAP = 10;
const ROW_GAP = 12;
const GLOW_PAD = 28;

/** Extra inset from screen right so speed-dial rows sit closer to the main FAB center. */
const ACTION_MENU_RIGHT_NUDGE = Math.round(FAB_SIZE * 0.05);

const MOTION_ENABLED = typeof process === 'undefined' || process.env.NODE_ENV !== 'test';

const MENU_ITEMS = [
  {
    key: 'appointment',
    icon: 'calendar-outline',
    label: 'Create appointment',
  },
  {
    key: 'payment',
    icon: 'card-outline',
    label: 'Create payment',
  },
  {
    key: 'quote',
    icon: 'document-outline',
    label: 'Create quote',
  },
];

/**
 * Floating create FAB with a speed-dial menu (label pill + icon row, + / × on main control).
 */
export function FloatingCreateMenu({
  onCreateAppointment,
  onCreateQuote,
  onCreatePayment,
  showCreatePayment = true,
  bottom = 30,
}) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const paymentPulse = useRef(new Animated.Value(MOTION_ENABLED ? 0 : 1)).current;
  const paymentGreen = colors.moneyPositive;
  const { showHighlight, markSeen } = useCreatePaymentHighlight({
    enabled: showCreatePayment,
  });
  const highlightPayment = showHighlight;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? 220 : 180,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  useEffect(() => {
    if (!MOTION_ENABLED || !open || !highlightPayment) {
      paymentPulse.setValue(1);
      return undefined;
    }
    paymentPulse.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(paymentPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(paymentPulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [highlightPayment, open, paymentPulse]);

  const vibrateSoft = useCallback(() => {
    Haptics.selectionAsync().catch(() => {
      Vibration.vibrate(6);
    });
  }, []);

  const dismissHighlight = useCallback(() => {
    if (showHighlight) {
      void markSeen();
    }
  }, [markSeen, showHighlight]);

  const animatePress = useCallback((value) => {
    Animated.spring(pressScale, {
      bounciness: 7,
      speed: 22,
      toValue: value,
      useNativeDriver: true,
    }).start();
  }, [pressScale]);

  const toggleMenu = useCallback(() => {
    vibrateSoft();
    setOpen((prev) => {
      if (prev) {
        dismissHighlight();
        return false;
      }
      return true;
    });
  }, [dismissHighlight, vibrateSoft]);

  const closeMenu = useCallback(() => {
    setOpen(false);
    dismissHighlight();
  }, [dismissHighlight]);

  const handleSelect = useCallback(
    (key) => {
      vibrateSoft();
      closeMenu();
      if (key === 'appointment') {
        onCreateAppointment?.();
        return;
      }
      if (key === 'quote') {
        onCreateQuote?.();
        return;
      }
      if (key === 'payment') {
        onCreatePayment?.();
      }
    },
    [closeMenu, onCreateAppointment, onCreatePayment, onCreateQuote, vibrateSoft],
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
          backgroundColor: 'rgba(0,0,0,0.52)',
        },
        actionColumn: {
          alignItems: 'flex-end',
          bottom: bottom + FAB_SIZE + ACTION_GAP,
          gap: ROW_GAP,
          position: 'absolute',
          right: SCREEN_GUTTER + ACTION_MENU_RIGHT_NUDGE,
          zIndex: 21,
        },
        actionRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
        },
        labelPress: {
          maxWidth: 240,
        },
        labelPill: {
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderColor: colors.borderStrong,
          borderRadius: 999,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 14,
          paddingVertical: 9,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 3,
        },
        labelPillPressed: {
          opacity: 0.72,
        },
        paymentPill: {
          backgroundColor: isDark ? 'rgba(52, 199, 89, 0.2)' : 'rgba(21, 128, 61, 0.12)',
          borderColor: paymentGreen,
          shadowColor: paymentGreen,
          shadowOpacity: 0.4,
          shadowRadius: 12,
        },
        labelText: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '600',
        },
        paymentLabel: {
          color: isDark ? '#86efac' : '#166534',
        },
        newChip: {
          backgroundColor: paymentGreen,
          borderRadius: 999,
          paddingHorizontal: 7,
          paddingVertical: 2,
        },
        newChipText: {
          color: isDark ? '#0a0a0a' : '#ffffff',
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        },
        actionIconOuter: {
          alignItems: 'center',
          backgroundColor: colors.accent,
          borderRadius: 24,
          height: 48,
          justifyContent: 'center',
          overflow: 'visible',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
          width: 48,
        },
        paymentIconOuter: {
          backgroundColor: paymentGreen,
          shadowColor: paymentGreen,
          shadowOpacity: 0.5,
          shadowRadius: 14,
        },
        fabHost: {
          alignItems: 'center',
          bottom: bottom - GLOW_PAD / 2,
          height: FAB_SIZE + GLOW_PAD,
          justifyContent: 'center',
          overflow: 'visible',
          position: 'absolute',
          right: SCREEN_GUTTER - GLOW_PAD / 2,
          width: FAB_SIZE + GLOW_PAD,
          zIndex: 30,
        },
        fabLift: {
          borderRadius: FAB_RADIUS,
          elevation: 14,
          height: FAB_SIZE,
          shadowColor: highlightPayment ? paymentGreen : '#000',
          shadowOffset: { width: 0, height: highlightPayment ? 0 : 10 },
          shadowOpacity: highlightPayment ? 0.5 : isDark ? 0.45 : 0.22,
          shadowRadius: highlightPayment ? 16 : 18,
          width: FAB_SIZE,
        },
        fabFace: {
          alignItems: 'center',
          borderRadius: FAB_RADIUS,
          height: FAB_SIZE,
          justifyContent: 'center',
          overflow: 'hidden',
          width: FAB_SIZE,
        },
        fabRim: {
          ...StyleSheet.absoluteFillObject,
          borderColor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.16)',
          borderRadius: FAB_RADIUS,
          borderWidth: StyleSheet.hairlineWidth,
        },
        fabPress: {
          alignItems: 'center',
          height: FAB_SIZE,
          justifyContent: 'center',
          width: FAB_SIZE,
        },
        plus: {
          alignItems: 'center',
          height: 22,
          justifyContent: 'center',
          width: 22,
        },
        plusBar: {
          backgroundColor: colors.buttonPrimaryText,
          borderRadius: 2,
          position: 'absolute',
        },
        plusBarH: {
          height: 2.5,
          width: 18,
        },
        plusBarV: {
          height: 18,
          width: 2.5,
        },
      }),
    [bottom, colors, highlightPayment, isDark, paymentGreen],
  );

  const menuItems = useMemo(
    () => MENU_ITEMS.filter((item) => item.key !== 'payment' || showCreatePayment),
    [showCreatePayment],
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
  const fabIconRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      {open ? (
        <View pointerEvents="box-none" style={styles.overlay}>
          <Pressable
            accessibilityLabel="Close create menu"
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
            {menuItems.map((item) => {
              const isPayment = item.key === 'payment' && highlightPayment;
              return (
                <View key={item.key} style={styles.actionRow}>
                  <Pressable
                    accessibilityLabel={item.label}
                    accessibilityRole="button"
                    style={styles.labelPress}
                    testID={`create-${item.key}`}
                    onPress={() => handleSelect(item.key)}
                  >
                    {({ pressed }) => (
                      <View
                        style={[
                          styles.labelPill,
                          isPayment && styles.paymentPill,
                          pressed && styles.labelPillPressed,
                        ]}
                      >
                        <View>
                          <Text
                            allowFontScaling={false}
                            numberOfLines={1}
                            style={[styles.labelText, isPayment && styles.paymentLabel]}
                          >
                            {item.label}
                          </Text>
                        </View>
                        {isPayment ? (
                          <View style={styles.newChip}>
                            <Text allowFontScaling={false} style={styles.newChipText}>
                              New
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    )}
                  </Pressable>
                  <Pressable
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    testID={`create-${item.key}-icon`}
                    onPress={() => handleSelect(item.key)}
                  >
                    {({ pressed }) => (
                      <View
                        style={[
                          styles.actionIconOuter,
                          isPayment && styles.paymentIconOuter,
                          pressed && styles.labelPillPressed,
                        ]}
                      >
                        {isPayment ? (
                          <Animated.View
                            pointerEvents="none"
                            style={[
                              StyleSheet.absoluteFillObject,
                              {
                                borderColor: isDark ? '#86efac' : '#ffffff',
                                borderRadius: 24,
                                borderWidth: 2,
                                opacity: paymentPulse.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.2, 0.85],
                                }),
                                transform: [
                                  {
                                    scale: paymentPulse.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [1, 1.28],
                                    }),
                                  },
                                ],
                              },
                            ]}
                          />
                        ) : null}
                        <Ionicons
                          color={isPayment ? (isDark ? '#0a0a0a' : '#ffffff') : colors.surface}
                          name={item.icon}
                          size={22}
                        />
                      </View>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </Animated.View>
        </View>
      ) : null}

      <View pointerEvents="box-none" style={styles.fabHost}>
        <CreateMenuFabGlow
          active={highlightPayment && !open}
          color={paymentGreen}
          size={FAB_SIZE}
        />
        <Animated.View
          style={[
            styles.fabLift,
            { transform: [{ scale: Animated.multiply(fabScale, pressScale) }] },
          ]}
        >
          <LinearGradient
            colors={
              isDark ? ['#ffffff', '#f3f3f3', '#e6e6e6'] : ['#2c2c2c', '#0a0a0a', '#050505']
            }
            end={{ x: 0.85, y: 1 }}
            start={{ x: 0.15, y: 0 }}
            style={styles.fabFace}
          >
            <View pointerEvents="none" style={styles.fabRim} />
            <Pressable
              accessibilityLabel={open ? 'Close create menu' : 'Open create menu'}
              accessibilityRole="button"
              style={styles.fabPress}
              testID="create-menu-fab"
              onPress={toggleMenu}
              onPressIn={() => animatePress(0.94)}
              onPressOut={() => animatePress(1)}
            >
              <Animated.View style={{ transform: [{ rotate: fabIconRotate }] }}>
                <View style={styles.plus}>
                  <View style={[styles.plusBar, styles.plusBarH]} />
                  <View style={[styles.plusBar, styles.plusBarV]} />
                </View>
              </Animated.View>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </View>
    </>
  );
}
