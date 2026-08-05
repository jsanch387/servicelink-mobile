import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { getWebAccountAdminUrl } from '../../../lib/webAppOrigin';
import { useTheme } from '../../../theme';
import { useAccountSettings } from '../../more/hooks/useAccountSettings';
import { RotatingCustomerSmsBubble } from '../components/RotatingCustomerSmsBubble';

const IMESSAGE_BLUE = '#0a84ff';

/**
 * Non-Pro upsell for customer texts — Subscribe opens web (App Store–safe).
 * Sells the feature with a mock message bubble that cycles through the real
 * job-lifecycle texts customers receive (confirmed → on the way → started →
 * finished → receipt/review), instead of copy alone.
 */
export function CustomerSmsUpsellScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { business } = useAccountSettings();
  const businessName = useMemo(
    () => business?.business_name?.trim() || null,
    [business?.business_name],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
          justifyContent: 'center',
          paddingBottom: Math.max(insets.bottom, 20),
          paddingHorizontal: SCREEN_GUTTER,
        },
        stack: {
          alignItems: 'center',
          gap: 28,
          width: '100%',
        },
        iconWrap: {
          alignItems: 'center',
          borderRadius: 26,
          height: 72,
          justifyContent: 'center',
          overflow: 'hidden',
          width: 72,
          ...Platform.select({
            ios: {
              shadowColor: IMESSAGE_BLUE,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
            },
            android: { elevation: 6 },
          }),
        },
        iconGradient: {
          alignItems: 'center',
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        },
        title: {
          color: colors.text,
          fontSize: 26,
          fontWeight: '800',
          letterSpacing: -0.6,
          lineHeight: 32,
          textAlign: 'center',
        },
        actions: {
          alignSelf: 'stretch',
          width: '100%',
        },
      }),
    [colors, insets.bottom],
  );

  return (
    <View style={styles.root}>
      <View style={styles.stack}>
        <View style={styles.iconWrap}>
          <LinearGradient
            colors={['#3aa0ff', IMESSAGE_BLUE]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.iconGradient}
          >
            <Ionicons color="#ffffff" name="chatbubble-ellipses" size={32} />
          </LinearGradient>
        </View>

        <AppText style={styles.title}>We text your customers for you</AppText>

        <RotatingCustomerSmsBubble businessName={businessName} />

        <View style={styles.actions}>
          <Button
            accessibilityHint="Opens ServiceLink on the web to manage your subscription"
            accessibilityLabel="Subscribe"
            fullWidth
            title="Subscribe"
            onPress={() => {
              void Linking.openURL(getWebAccountAdminUrl());
            }}
          />
        </View>
      </View>
    </View>
  );
}
