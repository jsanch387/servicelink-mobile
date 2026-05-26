import { useCallback, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppShellGlow, AppText, Button } from '../../../components/ui';
import { useAuth } from '../../auth';
import { AuthBrandLogo } from '../../auth/components/AuthBrandLogo';
import { useTheme } from '../../../theme';

/**
 * Native App Store 3.1.1: business onboarding stays on web/desktop — no in-app org registration.
 */
export function MobileSetupRequiredScreen() {
  const { colors } = useTheme();
  const { signOut } = useAuth();

  const handleSignOut = useCallback(() => {
    void signOut();
  }, [signOut]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        safe: {
          flex: 1,
          paddingHorizontal: 24,
        },
        center: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          maxWidth: 400,
          width: '100%',
          alignSelf: 'center',
        },
        title: {
          color: colors.text,
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.4,
          lineHeight: 28,
          marginTop: 20,
          textAlign: 'center',
        },
        body: {
          color: colors.textMuted,
          fontSize: 16,
          fontWeight: '500',
          lineHeight: 24,
          marginTop: 12,
          textAlign: 'center',
        },
        signOut: {
          marginTop: 28,
          width: '100%',
        },
      }),
    [colors],
  );

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <View style={styles.screen}>
      <AppShellGlow />
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safe}>
        <View style={styles.center}>
          <AuthBrandLogo />
          <AppText accessibilityRole="header" style={styles.title}>
            Finish setup on desktop
          </AppText>
          <AppText style={styles.body}>
            This app is for existing ServiceLink businesses. Complete your business setup in a
            desktop browser, then return here and sign in with the same email.
          </AppText>
          <Button
            accessibilityLabel="Sign out"
            fullWidth
            onPress={handleSignOut}
            style={styles.signOut}
            title="Sign out"
            variant="secondary"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
