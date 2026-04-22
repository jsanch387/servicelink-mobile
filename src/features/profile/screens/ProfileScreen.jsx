import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button } from '../../../components/ui';
import { useAuth } from '../../auth';
import { useTheme } from '../../../theme';

export function ProfileScreen() {
  const { signOut } = useAuth();
  const { colors } = useTheme();
  const [signingOut, setSigningOut] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        scroll: {
          flex: 1,
        },
        scrollContent: {
          paddingBottom: 24,
          paddingHorizontal: 16,
          paddingTop: 20,
        },
        screenTitle: {
          color: colors.text,
          fontSize: 28,
          fontWeight: '700',
          letterSpacing: -0.3,
          marginBottom: 8,
        },
        screenSubtitle: {
          color: colors.textMuted,
          fontSize: 15,
          lineHeight: 22,
        },
        footer: {
          paddingBottom: 8,
          paddingHorizontal: 24,
          paddingTop: 8,
        },
      }),
    [colors],
  );

  const handleSignOut = async () => {
    setSigningOut(true);
    const { error } = await signOut();
    setSigningOut(false);
    if (error) {
      Alert.alert('Sign out failed', error);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <AppText style={styles.screenTitle}>Profile</AppText>
        <AppText style={styles.screenSubtitle}>
          Manage your account and sign out when you are done on this device.
        </AppText>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          fullWidth
          loading={signingOut}
          title="Log out"
          variant="secondary"
          onPress={handleSignOut}
        />
      </View>
    </SafeAreaView>
  );
}
