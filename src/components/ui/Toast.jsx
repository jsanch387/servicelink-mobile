import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
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
const CARD_RADIUS = 18;

/** Overlay chrome — sits above `shell`, so it cannot reuse `cardSurface` (too close to the bg). */
const TOAST_SURFACE = {
  dark: {
    fill: ['#242426', '#1c1c1e'],
    bg: '#1c1c1e',
    border: 'rgba(255,255,255,0.12)',
    specular: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0)'],
    iconWell: 'rgba(255,255,255,0.06)',
    shadowOpacity: 0.5,
  },
  light: {
    fill: ['#ffffff', '#f4f4f5'],
    bg: '#ffffff',
    border: 'rgba(10,10,10,0.12)',
    specular: ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0)'],
    iconWell: 'rgba(10,10,10,0.05)',
    shadowOpacity: 0.16,
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
  const accent =
    type === 'success' ? colors.textSuccess : type === 'error' ? colors.danger : colors.text;
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
      iconWell: {
        backgroundColor: surface.iconWell,
      },
    }),
    [surface],
  );

  const handlePress = () => {
    onPress?.();
    onDismiss?.();
  };

  return (
    <View pointerEvents="box-none" style={[styles.host, { paddingTop: insets.top + 10 }]}>
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
            <LinearGradient
              colors={surface.fill}
              end={{ x: 0.5, y: 1 }}
              pointerEvents="none"
              start={{ x: 0.5, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <LinearGradient
              colors={surface.specular}
              end={{ x: 0.5, y: 1 }}
              pointerEvents="none"
              start={{ x: 0.5, y: 0 }}
              style={styles.specular}
            />
            <View style={styles.content}>
              <View style={[styles.iconWrap, themed.iconWell]}>
                <Ionicons color={accent} name={iconName} size={22} />
              </View>
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
    ...StyleSheet.absoluteFillObject,
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
    elevation: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    width: '100%',
  },
  glassShell: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  specular: {
    height: '40%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
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
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
    lineHeight: 19,
  },
  messageWithTitle: {},
});
