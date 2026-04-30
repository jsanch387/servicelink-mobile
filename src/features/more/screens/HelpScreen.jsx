import * as Clipboard from 'expo-clipboard';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { SUPPORT_EMAIL, SUPPORT_MAILTO_URI } from '../../../constants/supportContact';
import { useTheme } from '../../../theme';

export function HelpScreen() {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);

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
          gap: 16,
          paddingBottom: 28,
          paddingHorizontal: 20,
          paddingTop: 16,
        },
        card: {
          gap: 12,
        },
        title: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '700',
          letterSpacing: -0.2,
        },
        body: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
        },
        emailWell: {
          backgroundColor: colors.inputBg,
          borderColor: colors.border,
          borderRadius: 12,
          borderWidth: 1,
          marginTop: 4,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        emailText: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
        actions: {
          gap: 10,
          marginTop: 4,
        },
      }),
    [colors],
  );

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(SUPPORT_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleOpenMail = useCallback(() => {
    void Linking.openURL(SUPPORT_MAILTO_URI);
  }, []);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <SurfaceCard style={styles.card}>
          <AppText style={styles.title}>Contact support</AppText>
          <AppText style={styles.body}>
            For help or questions, reach us at the email below. You can copy it or open your mail
            app.
          </AppText>
          <Pressable
            accessibilityHint="Opens your email app"
            accessibilityLabel={`Email ${SUPPORT_EMAIL}`}
            accessibilityRole="button"
            onPress={handleOpenMail}
          >
            <View style={styles.emailWell}>
              <AppText selectable style={styles.emailText}>
                {SUPPORT_EMAIL}
              </AppText>
            </View>
          </Pressable>
          <View style={styles.actions}>
            <Button
              fullWidth
              title={copied ? 'Copied' : 'Copy email'}
              variant="secondary"
              onPress={() => {
                void handleCopy();
              }}
            />
            <Button fullWidth title="Email us" variant="surfaceLight" onPress={handleOpenMail} />
          </View>
        </SurfaceCard>
      </ScrollView>
    </View>
  );
}
