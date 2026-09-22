import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppShellGlow, AppText, Button } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { useAuth } from '../../auth';
import { AuthBrandLogo } from '../../auth/components/AuthBrandLogo';
import { useOnboardingGate } from '../../onboarding';
import {
  REMOVED_FROM_TEAM_BODY,
  REMOVED_FROM_TEAM_LOG_OUT,
  REMOVED_FROM_TEAM_START_BUSINESS,
  REMOVED_FROM_TEAM_TITLE,
} from '../constants/removedFromTeamCopy';

export function RemovedFromTeamScreen() {
  const { colors } = useTheme();
  const { signOut } = useAuth();
  const { startOwnBusiness } = useOnboardingGate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    const { error } = await signOut();
    setIsSigningOut(false);
    if (error) {
      Alert.alert('Sign out failed', safeUserFacingMessage(error));
    }
  }, [signOut]);

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
        buttonGap: {
          height: 12,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.screen} testID="removed-from-team-screen">
      <AppShellGlow />
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safe}>
        <View style={styles.body}>
          <AuthBrandLogo />
          <View style={styles.copy}>
            <AppText accessibilityRole="header" style={styles.title}>
              {REMOVED_FROM_TEAM_TITLE}
            </AppText>
            <AppText style={styles.subtitle}>{REMOVED_FROM_TEAM_BODY}</AppText>
          </View>
        </View>
        <View style={styles.actions}>
          <Button
            accessibilityHint="Signs you out of ServiceLink on this device"
            accessibilityLabel={REMOVED_FROM_TEAM_LOG_OUT}
            disabled={isSigningOut}
            fullWidth
            loading={isSigningOut}
            title={REMOVED_FROM_TEAM_LOG_OUT}
            onPress={() => void handleSignOut()}
          />
          <View style={styles.buttonGap} />
          <Button
            accessibilityHint="Starts setting up your own ServiceLink business"
            accessibilityLabel={REMOVED_FROM_TEAM_START_BUSINESS}
            disabled={isSigningOut}
            fullWidth
            title={REMOVED_FROM_TEAM_START_BUSINESS}
            variant="secondary"
            onPress={startOwnBusiness}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
