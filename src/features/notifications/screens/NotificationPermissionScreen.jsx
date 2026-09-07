import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppShellGlow, AppText, Button, SurfaceCard } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  NOTIFICATION_PERMISSION_BODY,
  NOTIFICATION_PERMISSION_ENABLE_LABEL,
  NOTIFICATION_PERMISSION_EXAMPLES,
  NOTIFICATION_PERMISSION_SKIP_LABEL,
  NOTIFICATION_PERMISSION_TITLE,
} from '../constants/notificationPermissionCopy';

/**
 * Pre-permission primer shown after sign-in (and onboarding) before the system prompt.
 */
export function NotificationPermissionScreen({ onEnable, onSkip, enableLoading = false }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        safe: {
          flex: 1,
        },
        body: {
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: SCREEN_GUTTER,
        },
        copy: {
          alignItems: 'center',
          alignSelf: 'center',
          maxWidth: 360,
          width: '100%',
        },
        iconWrap: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 22,
          borderWidth: 1,
          height: 72,
          justifyContent: 'center',
          marginBottom: 20,
          width: 72,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 28,
          letterSpacing: -0.65,
          lineHeight: 32,
          textAlign: 'center',
        },
        bodyText: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.regular,
          fontSize: 16,
          letterSpacing: -0.15,
          lineHeight: 23,
          marginTop: 8,
          maxWidth: 300,
          textAlign: 'center',
        },
        examples: {
          alignSelf: 'stretch',
          gap: 10,
          marginTop: 28,
          width: '100%',
        },
        preview: {
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        previewRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          width: '100%',
        },
        previewIcon: {
          alignItems: 'center',
          backgroundColor: colors.inputBg,
          borderColor: colors.border,
          borderRadius: 20,
          borderWidth: StyleSheet.hairlineWidth,
          height: 40,
          justifyContent: 'center',
          width: 40,
        },
        previewCopy: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        previewTitle: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          letterSpacing: -0.2,
          lineHeight: 20,
        },
        previewBody: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          letterSpacing: -0.1,
          lineHeight: 18,
          marginTop: 2,
        },
        previewTimeCol: {
          alignItems: 'flex-end',
          flexShrink: 0,
          justifyContent: 'flex-start',
          width: 36,
        },
        previewTime: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          letterSpacing: -0.1,
        },
        actions: {
          gap: 10,
          paddingBottom: 12,
          paddingHorizontal: SCREEN_GUTTER,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root} testID="notification-permission-screen">
      <AppShellGlow />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <View style={styles.body}>
          <View style={styles.copy}>
            <View style={styles.iconWrap}>
              <Ionicons color={colors.text} name="notifications-outline" size={34} />
            </View>
            <AppText style={styles.title}>{NOTIFICATION_PERMISSION_TITLE}</AppText>
            <AppText style={styles.bodyText}>{NOTIFICATION_PERMISSION_BODY}</AppText>
            <View style={styles.examples}>
              {NOTIFICATION_PERMISSION_EXAMPLES.map((example) => (
                <SurfaceCard key={example.title} padding="none" style={styles.preview}>
                  <View style={styles.previewRow}>
                    <View style={styles.previewIcon}>
                      <Ionicons color={colors.text} name={example.icon} size={18} />
                    </View>
                    <View style={styles.previewCopy}>
                      <AppText numberOfLines={1} style={styles.previewTitle}>
                        {example.title}
                      </AppText>
                      <AppText numberOfLines={1} style={styles.previewBody}>
                        {example.body}
                      </AppText>
                    </View>
                    <View style={styles.previewTimeCol}>
                      <AppText style={styles.previewTime}>{example.time}</AppText>
                    </View>
                  </View>
                </SurfaceCard>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.actions}>
          <Button
            accessibilityHint="Asks iOS for notification permission"
            accessibilityLabel={NOTIFICATION_PERMISSION_ENABLE_LABEL}
            disabled={enableLoading}
            fullWidth
            loading={enableLoading}
            title={NOTIFICATION_PERMISSION_ENABLE_LABEL}
            variant="primary"
            onPress={onEnable}
          />
          <Button
            accessibilityLabel={NOTIFICATION_PERMISSION_SKIP_LABEL}
            disabled={enableLoading}
            fullWidth
            title={NOTIFICATION_PERMISSION_SKIP_LABEL}
            variant="ghost"
            onPress={onSkip}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
