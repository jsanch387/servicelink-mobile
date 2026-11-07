import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { resolveToastEmailTokens, resolveToastSmsTokens } from './toastSmsTokens';

/** @typedef {'success' | 'error' | 'info'} ToastType */
/** @typedef {'default' | 'sms' | 'email'} ToastVariant */

const ENTER_DURATION = 220;
const EXIT_DURATION = 170;
const CARD_RADIUS = 12;

/** Near the shell, lifted by the edge. Avoid the mid-gray input fill. */
const TOAST_SURFACE = {
  dark: {
    bg: '#121212',
    border: 'rgba(255,255,255,0.16)',
    shadowOpacity: 0.35,
  },
  light: {
    bg: '#ffffff',
    border: 'rgba(10,10,10,0.1)',
    shadowOpacity: 0.1,
  },
};

const ICON_BY_TYPE = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

/**
 * Single floating toast — themed card (swipe up to dismiss).
 *
 * @param {{
 *   type: ToastType;
 *   variant?: ToastVariant;
 *   title?: string | null;
 *   message: string;
 *   dismissing: boolean;
 *   onHidden?: () => void;
 *   onDismiss?: () => void;
 *   onPress?: () => void;
 * }} props
 */
export function ToastView({
  type,
  variant = 'default',
  title,
  message,
  dismissing,
  onHidden,
  onDismiss,
  onPress,
}) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const translateY = useRef(new Animated.Value(-24)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const isSms = variant === 'sms';
  const isEmail = variant === 'email';
  const isConfirmationCard = isSms || isEmail;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -36 || gesture.vy < -0.4) {
          onDismiss?.();
        }
      },
    }),
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ENTER_DURATION,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 9,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  useEffect(() => {
    if (!dismissing) {
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: EXIT_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -24,
        duration: EXIT_DURATION,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onHidden?.();
      }
    });
  }, [dismissing, opacity, translateY, onHidden]);

  const confirmationTokens = isConfirmationCard
    ? isEmail
      ? resolveToastEmailTokens(type)
      : resolveToastSmsTokens(type)
    : null;
  const iconName = isConfirmationCard
    ? confirmationTokens.icon
    : (ICON_BY_TYPE[type] ?? ICON_BY_TYPE.info);
  const titleColor = colors.text;
  const messageColor = title && !isConfirmationCard ? colors.textMuted : colors.text;
  const surface = isDark ? TOAST_SURFACE.dark : TOAST_SURFACE.light;

  const themed = useMemo(
    () => ({
      cardShadow: {
        backgroundColor: surface.bg,
        shadowColor: '#000000',
        shadowOpacity: surface.shadowOpacity,
      },
      glassShell: {
        backgroundColor: surface.bg,
        borderColor: surface.border,
      },
    }),
    [surface],
  );

  const handlePress = () => {
    onPress?.();
    onDismiss?.();
  };

  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, styles.host, { paddingTop: insets.top + 10 }]}
    >
      <Animated.View
        {...panResponder.panHandlers}
        pointerEvents="box-none"
        style={[styles.animWrap, { opacity, transform: [{ translateY }] }]}
      >
        <Pressable
          accessibilityHint="Swipe up to dismiss"
          accessibilityLiveRegion="polite"
          accessibilityRole="button"
          onPress={handlePress}
          style={[styles.cardShadow, themed.cardShadow]}
        >
          <View style={[styles.glassShell, themed.glassShell]}>
            <View style={styles.content}>
              <Ionicons
                color={type === 'error' ? colors.danger : colors.text}
                name={iconName}
                size={18}
              />
              <View style={styles.textWrap}>
                {title && !isConfirmationCard ? (
                  <AppText numberOfLines={1} style={[styles.title, { color: titleColor }]}>
                    {title}
                  </AppText>
                ) : null}
                <AppText
                  numberOfLines={isConfirmationCard ? 4 : 3}
                  style={[
                    styles.message,
                    { color: messageColor },
                    title && !isConfirmationCard ? styles.messageWithTitle : null,
                  ]}
                >
                  {message}
                </AppText>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  animWrap: {
    maxWidth: 480,
    width: '100%',
  },
  cardShadow: {
    borderRadius: CARD_RADIUS,
    elevation: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    width: '100%',
  },
  glassShell: {
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  messageWithTitle: {},
});
