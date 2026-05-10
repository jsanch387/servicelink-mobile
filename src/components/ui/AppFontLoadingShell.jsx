import { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { APP_LAUNCH_LOGO_SOURCE, createAppLaunchScreenStyles } from './appLaunchScreenStyles';
import { AppLaunchAtmosphere } from './AppLaunchAtmosphere';
import { AppShellGlow } from './AppShellGlow';

/**
 * Full-screen boot branding: atmosphere, logo, “ServiceLink”, optional footer slot.
 * Use `animateEntrance` only for the first visible boot (font load). Later gates (auth /
 * subscription) should omit it or pass `false` so branding stays fully visible without a
 * second entrance animation.
 *
 * @param {{
 *   animateEntrance?: boolean;
 *   bottomSlot?: import('react').ReactNode;
 *   testID?: string;
 *   accessibilityLabel?: string;
 * }} props
 */
export function AppFontLoadingShell({
  animateEntrance = false,
  bottomSlot = null,
  testID = 'app-font-loading-shell',
  accessibilityLabel = 'Loading',
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createAppLaunchScreenStyles(colors), [colors]);

  const skipEntrance = !animateEntrance;
  const opacity = useRef(new Animated.Value(skipEntrance ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(skipEntrance ? 1 : 0.92)).current;
  const titleOpacity = useRef(new Animated.Value(skipEntrance ? 1 : 0)).current;
  const entranceStartedRef = useRef(false);

  useEffect(() => {
    if (!animateEntrance) {
      return;
    }
    if (entranceStartedRef.current) {
      return;
    }
    entranceStartedRef.current = true;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 9,
        tension: 68,
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 480,
        delay: 320,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animateEntrance, opacity, scale, titleOpacity]);

  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.root} testID={testID}>
      <AppLaunchAtmosphere />
      <AppShellGlow />
      <View style={styles.inner}>
        <Animated.View style={{ alignItems: 'center', opacity, transform: [{ scale }] }}>
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel="ServiceLink logo"
            accessibilityRole="image"
            resizeMode="contain"
            source={APP_LAUNCH_LOGO_SOURCE}
            style={styles.logo}
          />
        </Animated.View>
        <Animated.View style={{ opacity: titleOpacity }}>
          <Text accessibilityRole="header" style={styles.title}>
            ServiceLink
          </Text>
        </Animated.View>
        {bottomSlot ? <View style={styles.bottom}>{bottomSlot}</View> : null}
      </View>
    </View>
  );
}
