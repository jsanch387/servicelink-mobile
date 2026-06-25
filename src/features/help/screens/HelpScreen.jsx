import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText, SettingsNavRow, SettingsSection } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { TapToPayHowItWorksSheet } from '../../tap-to-pay/components/TapToPayHowItWorksSheet';
import { isTapToPayPlatformSupported } from '../../tap-to-pay/constants/tapToPayFeatureFlags';
import { HELP_EMPTY_STATE, HELP_TAP_TO_PAY_ROW_LABEL } from '../constants/helpCopy';

export function HelpScreen() {
  const { colors } = useTheme();
  const [tapToPayGuideVisible, setTapToPayGuideVisible] = useState(false);
  const showTapToPayGuide = isTapToPayPlatformSupported();

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
          flexGrow: 1,
          gap: 16,
          paddingBottom: 28,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        empty: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
          paddingHorizontal: 4,
          paddingTop: 4,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {showTapToPayGuide ? (
          <SettingsSection first title="Payments">
            <SettingsNavRow
              icon="phone-portrait-outline"
              label={HELP_TAP_TO_PAY_ROW_LABEL}
              showDividerBelow={false}
              onPress={() => setTapToPayGuideVisible(true)}
            />
          </SettingsSection>
        ) : (
          <AppText style={styles.empty}>{HELP_EMPTY_STATE}</AppText>
        )}
      </ScrollView>
      <TapToPayHowItWorksSheet
        visible={tapToPayGuideVisible}
        onRequestClose={() => setTapToPayGuideVisible(false)}
      />
    </View>
  );
}
