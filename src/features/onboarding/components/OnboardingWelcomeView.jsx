import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppShellGlow, AppText, Button } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { AuthBrandLogo } from '../../auth/components/AuthBrandLogo';
import {
  ONBOARDING_WELCOME_BODY,
  ONBOARDING_WELCOME_CTA,
  ONBOARDING_WELCOME_TITLE,
} from '../constants/onboardingWelcomeCopy';

/**
 * First-run welcome. CTA stays pinned to the bottom.
 *
 * @param {object} props
 * @param {() => void} props.onGetStarted
 */
export function OnboardingWelcomeView({ onGetStarted }) {
  const { colors } = useTheme();

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
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
        },
        copy: {
          alignItems: 'center',
          marginTop: 28,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 28,
          letterSpacing: -0.6,
          lineHeight: 34,
          textAlign: 'center',
        },
        subtitle: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 16,
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
      <AppShellGlow />
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safe}>
        <View style={styles.body}>
          <AuthBrandLogo />
          <View style={styles.copy}>
            <AppText accessibilityRole="header" style={styles.title}>
              {ONBOARDING_WELCOME_TITLE}
            </AppText>
            <AppText style={styles.subtitle}>{ONBOARDING_WELCOME_BODY}</AppText>
          </View>
        </View>
        <View style={styles.actions}>
          <Button fullWidth title={ONBOARDING_WELCOME_CTA} onPress={onGetStarted} />
        </View>
      </SafeAreaView>
    </View>
  );
}
