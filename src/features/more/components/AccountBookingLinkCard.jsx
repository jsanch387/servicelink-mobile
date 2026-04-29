import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

export function AccountBookingLinkCard({
  hasSlug,
  displayLink,
  httpsUrl,
  canEditSlug,
  onChangeLink,
}) {
  const { colors, isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: { gap: 14 },
        cardHeaderRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          minHeight: 24,
        },
        cardTitle: {
          color: colors.text,
          flex: 1,
          fontSize: 16,
          fontWeight: '700',
          letterSpacing: -0.2,
        },
        iconHit: {
          alignItems: 'center',
          height: 28,
          justifyContent: 'center',
          opacity: 1,
          width: 28,
        },
        iconHitDisabled: {
          opacity: 0.35,
        },
        linkDescription: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
        },
        linkWell: {
          backgroundColor: isDark ? colors.surface : colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 12,
          borderWidth: 1,
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        linkUrl: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
        },
        linkActions: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 2,
        },
        copyPress: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 6,
          paddingVertical: 4,
        },
        copyLabel: {
          color: colors.accent,
          fontSize: 15,
          fontWeight: '600',
        },
        copyLabelDone: {
          color: colors.textMuted,
        },
        copyDisabled: {
          opacity: 0.45,
        },
        changeLink: {
          paddingVertical: 4,
        },
        changeLinkText: {
          color: colors.accent,
          fontSize: 15,
          fontWeight: '600',
        },
        changeLinkDisabled: {
          color: colors.textMuted,
        },
      }),
    [colors, isDark],
  );

  const handleCopyLink = useCallback(async () => {
    if (!httpsUrl) return;
    await Clipboard.setStringAsync(httpsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [httpsUrl]);

  const handleOpenPublicPage = useCallback(() => {
    if (!httpsUrl) return;
    void Linking.openURL(httpsUrl);
  }, [httpsUrl]);

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <AppText style={styles.cardTitle}>Your Link</AppText>
        <Pressable
          accessibilityLabel="Open public booking page"
          accessibilityRole="button"
          accessibilityState={{ disabled: !hasSlug }}
          disabled={!hasSlug}
          hitSlop={8}
          style={[styles.iconHit, !hasSlug && styles.iconHitDisabled]}
          onPress={handleOpenPublicPage}
        >
          <Ionicons color={colors.textMuted} name="open-outline" size={20} />
        </Pressable>
      </View>

      <AppText style={styles.linkDescription}>
        This is your public booking link. Share it anywhere customers find you.
      </AppText>

      <View style={styles.linkWell}>
        <AppText selectable style={styles.linkUrl}>
          {hasSlug ? displayLink : 'Set a path below to publish your booking page.'}
        </AppText>
      </View>

      <View style={styles.linkActions}>
        <Pressable
          accessibilityLabel={copied ? 'Link copied' : 'Copy booking link'}
          accessibilityRole="button"
          accessibilityState={{ disabled: !hasSlug }}
          disabled={!hasSlug}
          style={[styles.copyPress, !hasSlug && styles.copyDisabled]}
          onPress={() => {
            void handleCopyLink();
          }}
        >
          <Ionicons
            color={copied ? colors.textMuted : colors.accent}
            name={copied ? 'checkmark-circle-outline' : 'copy-outline'}
            size={16}
          />
          <AppText style={[styles.copyLabel, copied && styles.copyLabelDone]}>
            {copied ? 'Copied' : 'Copy'}
          </AppText>
        </Pressable>

        <Pressable
          accessibilityLabel="Change booking link"
          accessibilityRole="button"
          disabled={!canEditSlug}
          style={styles.changeLink}
          onPress={() => {
            if (canEditSlug) onChangeLink?.();
          }}
        >
          <AppText style={[styles.changeLinkText, !canEditSlug && styles.changeLinkDisabled]}>
            Change link
          </AppText>
        </Pressable>
      </View>
    </SurfaceCard>
  );
}
