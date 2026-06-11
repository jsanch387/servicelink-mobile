import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';

/** @typedef {'success' | 'error' | 'loading' | 'info'} ToastType */

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
 * Single floating toast — solid white pill with a subtle top sheen (readable on dark shells).
 * Gradient layers only (no BlurView) so dev clients without ExpoBlur stay warning-free.
 *
 * @param {{
 *   type: ToastType;
 *   title?: string | null;
 *   message: string;
 *   dismissing: boolean;
 *   onHidden?: () => void;
 *   onPress?: () => void;
 * }} props
 */
export function ToastView({ type, title, message, dismissing, onHidden, onPress }) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-24)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const prevTypeRef = useRef(type);

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

  const accent = type === 'success' ? GLASS.success : type === 'error' ? GLASS.error : GLASS.info;

  return (
    <View pointerEvents="box-none" style={[styles.host, { paddingTop: insets.top + 10 }]}>
      <Animated.View
        pointerEvents="box-none"
        style={[styles.animWrap, { opacity, transform: [{ translateY }] }]}
      >
        <Pressable
          accessibilityLiveRegion="polite"
          accessibilityRole={onPress ? 'button' : 'text'}
          onPress={onPress}
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
                    <Ionicons
                      color={accent}
                      name={ICON_BY_TYPE[type] ?? ICON_BY_TYPE.info}
                      size={22}
                    />
                  </Animated.View>
                )}
              </View>
              <View style={styles.textWrap}>
                {title ? (
                  <AppText numberOfLines={1} style={styles.title}>
                    {title}
                  </AppText>
                ) : null}
                <AppText
                  numberOfLines={3}
                  style={[styles.message, title ? styles.messageWithTitle : null]}
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
    zIndex: 40,
  },
  animWrap: {
    maxWidth: 480,
    width: '100%',
  },
  cardShadow: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
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
    borderRadius: 22,
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
    color: GLASS.text,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
    lineHeight: 19,
  },
  messageWithTitle: {
    color: GLASS.textSecondary,
  },
});
