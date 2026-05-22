import { useCallback, useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { getWebAccountAdminUrl } from '../../../lib/webAppOrigin';
import { useTheme } from '../../../theme';
import {
  ACCOUNT_WEB_PANEL_NOTE_BODY,
  ACCOUNT_WEB_PANEL_NOTE_TITLE,
  ACCOUNT_WEB_PANEL_OPEN_BUTTON_LABEL,
} from '../constants/accountWebPanelNote';

/**
 * Account administration on web — opens the ServiceLink site in the browser (not in-app checkout).
 */
export function AccountWebPanelNote() {
  const { colors } = useTheme();
  const websiteUrl = useMemo(() => getWebAccountAdminUrl(), []);

  const handleOpenWebsite = useCallback(() => {
    void Linking.openURL(websiteUrl);
  }, [websiteUrl]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          marginTop: 22,
        },
        title: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
          marginBottom: 8,
        },
        body: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.05,
          lineHeight: 20,
        },
        openButton: {
          marginTop: 16,
        },
      }),
    [colors.textMuted, colors.textSecondary],
  );

  return (
    <View style={styles.root}>
      <AppText accessibilityRole="header" style={styles.title}>
        {ACCOUNT_WEB_PANEL_NOTE_TITLE}
      </AppText>
      <SurfaceCard padding="md">
        <AppText style={styles.body}>{ACCOUNT_WEB_PANEL_NOTE_BODY}</AppText>
        <Button
          accessibilityHint="Opens ServiceLink in your browser to manage your account"
          accessibilityLabel={ACCOUNT_WEB_PANEL_OPEN_BUTTON_LABEL}
          fullWidth
          style={styles.openButton}
          title={ACCOUNT_WEB_PANEL_OPEN_BUTTON_LABEL}
          variant="secondary"
          onPress={handleOpenWebsite}
        />
      </SurfaceCard>
    </View>
  );
}
