import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppText,
  AppVersionFootnote,
  BetaLabel,
  SettingsNavRow,
  SettingsSection,
} from '../../../components/ui';
import { resetAppUpdatesForDev } from '../../appUpdates';
import { clearTapToPayEducationSeen } from '../../tap-to-pay/native/presentTapToPayEducation';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { SCREEN_GUTTER } from '../../../constants/layout';

export function MoreScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollBottomPad = 28 + Math.max(tabBarHeight, 72);

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
          paddingHorizontal: SCREEN_GUTTER,
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
      }),
    [colors, scrollBottomPad],
  );

  const handleDevResetAppUpdates = () => {
    void Promise.all([resetAppUpdatesForDev(), clearTapToPayEducationSeen()]).then(() => {
      Alert.alert('Dev', "What's new and Tap to Pay education flags reset.");
    });
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
            icon="albums-outline"
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
            icon="star-outline"
            label="Reviews"
            onPress={() => navigation.navigate(ROUTES.REVIEWS)}
          />
          <SettingsNavRow
            icon="repeat-outline"
            label="Maintenance details"
            labelAccessory={<BetaLabel />}
            onPress={() => navigation.navigate(ROUTES.MAINTENANCE)}
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
            icon="chatbubble-ellipses-outline"
            label="Support"
            onPress={() => navigation.navigate(ROUTES.SUPPORT)}
          />
          <SettingsNavRow
            icon="newspaper-outline"
            label="Privacy & terms"
            showDividerBelow={false}
            onPress={() => navigation.navigate(ROUTES.LEGAL)}
          />
        </SettingsSection>

        {typeof __DEV__ !== 'undefined' && __DEV__ ? (
          <Pressable
            accessibilityHint="Dev only: long press to reset what's new announcements"
            accessibilityRole="button"
            onLongPress={handleDevResetAppUpdates}
          >
            <AppVersionFootnote />
          </Pressable>
        ) : (
          <AppVersionFootnote />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
