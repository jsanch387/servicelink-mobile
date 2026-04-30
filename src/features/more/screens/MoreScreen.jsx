import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, SettingsNavRow, SettingsSection } from '../../../components/ui';
import { getAppVersionLine } from '../../../constants/appInfo';
import { ROUTES } from '../../../routes/routes';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { useAuth } from '../../auth';
import { useTheme } from '../../../theme';

/** Placeholder until each destination has its own screen. */
function noopNav() {}

export function MoreScreen() {
  const { signOut } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollBottomPad = 28 + Math.max(tabBarHeight, 72);
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
        content: {
          alignItems: 'stretch',
          paddingBottom: scrollBottomPad,
          paddingHorizontal: 20,
          paddingTop: 12,
          width: '100%',
        },
        screenTitle: {
          color: colors.text,
          fontSize: 28,
          fontWeight: '700',
          letterSpacing: -0.3,
          marginBottom: 20,
        },
        actions: {
          alignSelf: 'stretch',
          marginTop: 28,
        },
        version: {
          color: colors.textMuted,
          fontSize: 12,
          letterSpacing: 0.2,
          marginTop: 20,
          textAlign: 'center',
        },
      }),
    [colors, scrollBottomPad],
  );

  const handleSignOut = async () => {
    setSigningOut(true);
    const { error } = await signOut();
    setSigningOut(false);
    if (error) {
      Alert.alert('Sign out failed', safeUserFacingMessage(error));
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <AppText style={styles.screenTitle}>More</AppText>
        <SettingsSection first title="Business">
          <SettingsNavRow
            icon="construct-outline"
            label="Services"
            onPress={() => navigation.navigate(ROUTES.SERVICES_LIST)}
          />
          <SettingsNavRow
            icon="time-outline"
            label="Availability"
            onPress={() => navigation.navigate(ROUTES.AVAILABILITY)}
          />
          <SettingsNavRow
            icon="document-text-outline"
            label="Quotes"
            onPress={() => navigation.navigate(ROUTES.QUOTES)}
          />
          <SettingsNavRow
            icon="link-outline"
            label="Booking link"
            onPress={() => navigation.navigate(ROUTES.BOOKING_LINK)}
          />
          <SettingsNavRow
            icon="card-outline"
            label="Payments"
            showDividerBelow={false}
            onPress={() => navigation.navigate(ROUTES.MORE_PAYMENTS)}
          />
        </SettingsSection>

        <SettingsSection title="Account">
          <SettingsNavRow
            icon="person-outline"
            label="Account"
            onPress={() => navigation.navigate(ROUTES.ACCOUNT_SETTINGS)}
          />
          <SettingsNavRow
            icon="notifications-outline"
            label="Notifications"
            showDividerBelow={false}
            onPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
          />
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsNavRow
            icon="help-circle-outline"
            label="Help"
            onPress={() => navigation.navigate(ROUTES.HELP)}
          />
          <SettingsNavRow
            icon="shield-checkmark-outline"
            label="Privacy policy"
            showDividerBelow={false}
            onPress={noopNav}
          />
        </SettingsSection>

        <View style={styles.actions}>
          <Button
            fullWidth
            loading={signingOut}
            title="Log out"
            variant="secondary"
            onPress={handleSignOut}
          />
        </View>

        <AppText style={styles.version}>{getAppVersionLine()}</AppText>
      </ScrollView>
    </SafeAreaView>
  );
}
