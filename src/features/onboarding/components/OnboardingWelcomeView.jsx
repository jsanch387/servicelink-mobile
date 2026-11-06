import { useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  ONBOARDING_WELCOME_BODY,
  ONBOARDING_WELCOME_CTA,
  ONBOARDING_WELCOME_TITLE,
} from '../constants/onboardingWelcomeCopy';
import { WelcomeIllustration } from './WelcomeIllustration';

/**
 * First-run welcome. The calendar sits above the title, with one line under it.
 *
 * @param {object} props
 * @param {() => void} props.onGetStarted
 */
export function OnboardingWelcomeView({ onGetStarted }) {
  const { colors } = useTheme();
  const entrance = useWelcomeEntrance();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        safe: {
          backgroundColor: 'transparent',
          flex: 1,
        },
        body: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 20,
        },
        copy: {
          alignSelf: 'stretch',
        },
        art: {
          marginBottom: 28,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 32,
          letterSpacing: -0.6,
          lineHeight: 38,
          textAlign: 'center',
        },
        subtitle: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 17,
          lineHeight: 24,
          marginTop: 12,
          textAlign: 'center',
        },
        actions: {
          paddingBottom: 8,
          paddingHorizontal: 24,
          paddingTop: 12,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.screen} testID="welcome-screen">
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safe}>
        <View style={styles.body}>
          <Animated.View
            style={{
              alignItems: 'center',
              alignSelf: 'stretch',
              opacity: entrance.opacity,
              transform: [{ translateY: entrance.translateY }],
            }}
          >
            <View style={styles.art}>
              <WelcomeIllustration />
            </View>
            <AppText accessibilityRole="header" style={[styles.title, styles.copy]}>
              {ONBOARDING_WELCOME_TITLE}
            </AppText>
            <AppText style={[styles.subtitle, styles.copy]}>{ONBOARDING_WELCOME_BODY}</AppText>
          </Animated.View>
        </View>
        <View style={styles.actions}>
          <Button fullWidth title={ONBOARDING_WELCOME_CTA} onPress={onGetStarted} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function useWelcomeEntrance() {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    let mounted = true;
    let entrance = null;

    const play = (reduced) => {
      if (!mounted) return;
      if (reduced) {
        opacity.setValue(1);
        translateY.setValue(0);
        return;
      }
      entrance = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
      entrance.start();
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => play(Boolean(enabled)))
      .catch(() => play(false));

    return () => {
      mounted = false;
      entrance?.stop();
    };
  }, [opacity, translateY]);

  return { opacity, translateY };
}
