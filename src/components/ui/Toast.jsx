import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { resolveToastEmailTokens, resolveToastSmsTokens } from './toastSmsTokens';

/** @typedef {'success' | 'error' | 'loading' | 'info'} ToastType */
/** @typedef {'default' | 'sms' | 'email'} ToastVariant */

const ENTER_DURATION = 220;
const EXIT_DURATION = 170;

const GLASS = {
  text: '#0a0a0a',
  textSecondary: '#404040',
  success: '#15803d',
  error: '#dc2626',
  info: '#0a0a0a',
};

const ICON_BY_TYPE = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

/**
 * Single floating toast — default pill or SMS card (white surface, accent text, swipe up to dismiss).
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
  const translateY = useRef(new Animated.Value(-24)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const prevTypeRef = useRef(type);
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
    const settledFromLoading = prevTypeRef.current === 'loading' && type !== 'loading';
    prevTypeRef.current = type;
    if (!settledFromLoading) {
      return;
    }
    iconScale.setValue(0.5);
    Animated.spring(iconScale, {
      toValue: 1,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [type, iconScale]);

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
  const accent = isConfirmationCard
    ? confirmationTokens.text
    : type === 'success'
      ? GLASS.success
      : type === 'error'
        ? GLASS.error
        : GLASS.info;
  const iconName = isConfirmationCard
    ? confirmationTokens.icon
    : (ICON_BY_TYPE[type] ?? ICON_BY_TYPE.info);
  const messageColor = isConfirmationCard
    ? confirmationTokens.text
    : title
      ? GLASS.textSecondary
      : GLASS.text;

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
          style={styles.cardShadow}
        >
          <View style={styles.glassShell}>
            <LinearGradient
              colors={['#ffffff', '#f7f7f8']}
              end={{ x: 0.5, y: 1 }}
              pointerEvents="none"
              start={{ x: 0.5, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <LinearGradient
              colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0)']}
              end={{ x: 0.5, y: 1 }}
              pointerEvents="none"
              start={{ x: 0.5, y: 0 }}
              style={styles.specular}
            />
            <View style={styles.content}>
              <View style={styles.iconWrap}>
                {type === 'loading' ? (
                  <ActivityIndicator color={GLASS.text} size="small" />
                ) : (
                  <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                    <Ionicons color={accent} name={iconName} size={22} />
                  </Animated.View>
                )}
              </View>
              <View style={styles.textWrap}>
                {title && !isConfirmationCard ? (
                  <AppText numberOfLines={1} style={styles.title}>
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
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 16,
    width: '100%',
  },
  glassShell: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
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
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: GLASS.text,
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
  messageWithTitle: {
    color: GLASS.textSecondary,
  },
});
