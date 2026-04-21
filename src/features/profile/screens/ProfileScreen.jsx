import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppShellGlow, Button } from '../../../components/ui';
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
        spacer: {
          flex: 1,
        },
        footer: {
          paddingBottom: 8,
          paddingHorizontal: 24,
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
      <AppShellGlow />
      <View style={styles.spacer} />
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
