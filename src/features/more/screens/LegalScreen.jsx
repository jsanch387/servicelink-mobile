import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SettingsNavRow, SettingsSection } from '../../../components/ui';
import { getWebPrivacyPolicyUrl, getWebTermsOfServiceUrl } from '../../../lib/webAppOrigin';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { useTheme } from '../../../theme';

export function LegalScreen() {
  const { colors } = useTheme();
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
          paddingBottom: scrollBottomPad,
          paddingHorizontal: 20,
          paddingTop: 16,
          width: '100%',
        },
      }),
    [colors, scrollBottomPad],
  );

  const handleOpenExternal = async (url, label) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Unable to open link', `Could not open ${label}.`);
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Unable to open link', safeUserFacingMessage(error));
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <SettingsSection first title="Documents">
          <SettingsNavRow
            icon="shield-checkmark-outline"
            label="Privacy policy"
            onPress={() => {
              void handleOpenExternal(getWebPrivacyPolicyUrl(), 'Privacy policy');
            }}
          />
          <SettingsNavRow
            icon="reader-outline"
            label="Terms of service"
            showDividerBelow={false}
            onPress={() => {
              void handleOpenExternal(getWebTermsOfServiceUrl(), 'Terms of service');
            }}
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}
