import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

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
        card: {
          gap: 12,
        },
        linkDescription: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          letterSpacing: -0.05,
          lineHeight: 20,
        },
        copyRow: {
          alignItems: 'center',
          backgroundColor: isDark ? colors.surface : colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 12,
          borderWidth: 1,
          flexDirection: 'row',
          paddingHorizontal: 14,
          paddingVertical: 13,
          width: '100%',
        },
        copyPressed: {
          opacity: 0.88,
        },
        copyDisabled: {
          opacity: 0.45,
        },
        linkCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
          paddingRight: 10,
        },
        linkUrl: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          letterSpacing: -0.1,
        },
        copyIconCol: {
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
        },
        editRow: {
          alignItems: 'flex-end',
          width: '100%',
        },
        editHit: {
          paddingVertical: 2,
        },
        editLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          textDecorationLine: 'underline',
          textDecorationColor: colors.textMuted,
        },
        editDisabled: {
          opacity: 0.4,
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

  return (
    <SurfaceCard style={styles.card}>
      <AppText style={styles.linkDescription}>
        This is the link you share with customers so they can book you.
      </AppText>

      <Pressable
        accessibilityLabel={copied ? 'Link copied' : 'Copy booking link'}
        accessibilityRole="button"
        accessibilityState={{ disabled: !hasSlug }}
        disabled={!hasSlug}
        onPress={() => {
          void handleCopyLink();
        }}
      >
        {({ pressed }) => (
          <View
            style={[
              styles.copyRow,
              pressed && hasSlug && styles.copyPressed,
              !hasSlug && styles.copyDisabled,
            ]}
          >
            <View style={styles.linkCol}>
              <AppText numberOfLines={2} selectable style={styles.linkUrl}>
                {hasSlug ? displayLink : 'Add a path to publish your booking page.'}
              </AppText>
            </View>
            <View style={styles.copyIconCol}>
              <Ionicons
                color={copied ? colors.textSuccess : colors.textMuted}
                name={copied ? 'checkmark' : 'copy-outline'}
                size={18}
              />
            </View>
          </View>
        )}
      </Pressable>

      <View style={styles.editRow}>
        <Pressable
          accessibilityLabel="Edit booking link"
          accessibilityRole="button"
          disabled={!canEditSlug}
          onPress={() => {
            if (canEditSlug) onChangeLink?.();
          }}
        >
          {({ pressed }) => (
            <View style={[styles.editHit, pressed && canEditSlug && { opacity: 0.7 }]}>
              <AppText style={[styles.editLabel, !canEditSlug && styles.editDisabled]}>
                Edit link
              </AppText>
            </View>
          )}
        </Pressable>
      </View>
    </SurfaceCard>
  );
}
