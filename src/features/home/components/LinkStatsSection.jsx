import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText, InlineCardError, SkeletonBox, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { getBookingLinkDisplay, getBookingLinkHttpsUrl } from '../utils/bookingLink';

function LinkStatsSkeleton() {
  const { colors, isDark } = useTheme();
  const wellBg = useMemo(
    () => ({
      backgroundColor: isDark ? colors.surface : colors.shellElevated,
      borderColor: colors.border,
    }),
    [colors, isDark],
  );

  return (
    <SurfaceCard style={styles.compactCard}>
      <View style={styles.topRow}>
        <View style={styles.viewsBlock}>
          <SkeletonBox borderRadius={10} height={28} width={54} />
          <SkeletonBox borderRadius={8} height={14} style={{ marginTop: 8 }} width={90} />
        </View>
      </View>
      <View style={[styles.linkWell, wellBg]}>
        <SkeletonBox borderRadius={8} height={16} width="76%" />
      </View>
      <SkeletonBox borderRadius={14} height={40} style={styles.copySkeleton} width={46} />
    </SurfaceCard>
  );
}

export function LinkStatsSection({ slug, profileViews, isLoading, businessError }) {
  const { colors, isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  const hasSlug = useMemo(() => Boolean(slug?.trim()), [slug]);
  const displayLink = useMemo(() => getBookingLinkDisplay(slug), [slug]);
  const httpsUrl = useMemo(() => getBookingLinkHttpsUrl(slug), [slug]);

  const viewsDisplay = useMemo(() => {
    if (isLoading && profileViews === null) {
      return null;
    }
    if (profileViews === null || Number.isNaN(profileViews)) {
      return '0';
    }
    return profileViews.toLocaleString();
  }, [isLoading, profileViews]);

  const handleCopy = useCallback(async () => {
    if (!httpsUrl) {
      return;
    }
    await Clipboard.setStringAsync(httpsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [httpsUrl]);

  const linkWellStyle = useMemo(
    () => ({
      backgroundColor: isDark ? colors.surface : colors.shellElevated,
      borderColor: colors.border,
    }),
    [colors, isDark],
  );

  if (isLoading) {
    return <LinkStatsSkeleton />;
  }

  if (businessError) {
    return (
      <SurfaceCard style={styles.compactCard}>
        <View style={styles.topRow}>
          <View style={styles.viewsBlock}>
            <AppText style={[styles.viewsValue, { color: colors.text }]}>0</AppText>
            <AppText style={[styles.viewsLabel, { color: colors.textMuted }]}>Views</AppText>
          </View>
        </View>
        <InlineCardError message={businessError} />
        <View style={[styles.linkRow, styles.linkRowDisabled]}>
          <View style={[styles.linkWell, linkWellStyle, styles.linkWellMuted]}>
            <AppText style={[styles.linkUnavailable, { color: colors.textMuted }]}>
              Link unavailable until your business profile loads.
            </AppText>
          </View>
          <View style={[styles.copyPill, styles.copyPillDisabled]}>
            <Ionicons color={colors.textMuted} name="clipboard-outline" size={20} />
          </View>
        </View>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard style={styles.compactCard}>
      <View style={styles.topRow}>
        <View style={styles.viewsBlock}>
          <AppText style={[styles.viewsValue, { color: colors.text }]}>{viewsDisplay}</AppText>
          <AppText style={[styles.viewsLabel, { color: colors.textMuted }]}>Views</AppText>
        </View>
      </View>
      <View style={styles.linkRow}>
        <View style={[styles.linkWell, linkWellStyle]}>
          <AppText
            accessibilityLabel={
              hasSlug
                ? `Booking link ${displayLink}`
                : 'No booking link. Set business slug in your dashboard.'
            }
            ellipsizeMode="tail"
            numberOfLines={1}
            selectable={hasSlug}
            style={[
              hasSlug ? styles.linkText : styles.linkPlaceholder,
              hasSlug
                ? {
                    color: colors.text,
                    fontFamily: Platform.select({
                      ios: 'Menlo',
                      android: 'monospace',
                      default: 'monospace',
                    }),
                  }
                : { color: colors.textMuted },
            ]}
          >
            {hasSlug ? displayLink : 'Set your business slug to get a shareable link.'}
          </AppText>
        </View>
        <Pressable
          accessibilityLabel={copied ? 'Link copied' : 'Copy booking link'}
          accessibilityRole="button"
          accessibilityState={{ disabled: !hasSlug }}
          disabled={!hasSlug}
          onPress={handleCopy}
          style={({ pressed }) => [
            styles.copyPill,
            {
              backgroundColor: pressed ? colors.buttonSecondaryBgPressed : colors.buttonSecondaryBg,
            },
            !hasSlug && styles.copyPillDisabled,
          ]}
        >
          <Ionicons
            color={colors.buttonSecondaryText}
            name={copied ? 'checkmark' : 'clipboard-outline'}
            size={20}
            style={!hasSlug ? styles.copyIconMuted : undefined}
          />
        </Pressable>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  compactCard: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  viewsBlock: {
    alignItems: 'flex-start',
  },
  linkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  linkRowDisabled: {
    marginTop: 8,
  },
  viewsValue: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  viewsLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  linkWell: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    minHeight: 40,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  linkWellMuted: {
    justifyContent: 'center',
  },
  linkUnavailable: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
    minWidth: 0,
  },
  linkPlaceholder: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    minWidth: 0,
  },
  copyPill: {
    alignItems: 'center',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    minWidth: 46,
    paddingHorizontal: 12,
  },
  copySkeleton: {
    marginTop: 10,
  },
  copyPillDisabled: {
    opacity: 0.35,
  },
  copyIconMuted: {
    opacity: 0.7,
  },
});
