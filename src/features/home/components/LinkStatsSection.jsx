import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText, InlineCardError, SkeletonBox, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { LINK_VIEWS_PERIOD_LABELS } from '../constants/linkViews';
import { getBookingLinkDisplay, getBookingLinkHttpsUrl } from '../utils/bookingLink';
import { formatLinkViewsLastVisit } from '../utils/formatLinkViewsLastVisit';
import { LinkViewsPeriodPicker } from './LinkViewsPeriodPicker';

function LinkStatsSkeleton() {
  const { colors, isDark } = useTheme();
  const wellBg = useMemo(
    () => ({
      backgroundColor: isDark ? '#0e0e0e' : colors.shellElevated,
    }),
    [colors, isDark],
  );

  return (
    <SurfaceCard
      accessibilityLabel="Loading link visits"
      accessibilityRole="progressbar"
      outlined={false}
      padding="none"
      style={styles.card}
    >
      <View style={styles.inner}>
        <View style={styles.statsBlock}>
          <View style={styles.topRow}>
            <SkeletonBox borderRadius={8} height={34} pulse style={styles.viewsSkeleton} />
            <SkeletonBox borderRadius={10} height={30} pulse width={88} />
          </View>
          <View style={styles.metaRow}>
            <SkeletonBox
              borderRadius={5}
              height={16}
              pulse
              style={styles.periodSkeleton}
              width={88}
            />
          </View>
        </View>
        <View style={[styles.linkRow, wellBg]}>
          <SkeletonBox borderRadius={6} height={13} pulse style={styles.linkTextSkeleton} />
          <SkeletonBox borderRadius={8} height={18} pulse width={18} />
        </View>
      </View>
    </SurfaceCard>
  );
}

export function LinkStatsSection({
  slug,
  views = 0,
  lastViewedAt = null,
  period = '24h',
  /** Period used for the count query (may differ from `period` for free users). */
  effectivePeriod = period,
  onPeriodChange,
  hasProAccess = false,
  isLoading,
  isPendingViews = false,
  viewsError = null,
  businessError,
  /** When the parent shows a shared banner (e.g. profile load failure), keep muted link UI without a second inline error. */
  linkSectionDegraded = false,
}) {
  const { colors, isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  const hasSlug = useMemo(() => Boolean(slug?.trim()), [slug]);
  const displayLink = useMemo(() => getBookingLinkDisplay(slug), [slug]);
  const httpsUrl = useMemo(() => getBookingLinkHttpsUrl(slug), [slug]);

  const viewsDisplay = useMemo(() => {
    if (isLoading || (isPendingViews && views === 0)) {
      return null;
    }
    const n = Number(views);
    if (Number.isNaN(n)) {
      return '0';
    }
    return n.toLocaleString();
  }, [isLoading, isPendingViews, views]);

  const periodLabel = LINK_VIEWS_PERIOD_LABELS[effectivePeriod] ?? LINK_VIEWS_PERIOD_LABELS['24h'];
  const lastVisitRelative = useMemo(() => formatLinkViewsLastVisit(lastViewedAt), [lastViewedAt]);
  const visitsCount = useMemo(() => {
    if (viewsDisplay === null) {
      return null;
    }
    const n = Number(views);
    return Number.isNaN(n) ? 0 : n;
  }, [views, viewsDisplay]);
  const showLastVisit = visitsCount != null && visitsCount > 0;

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
      backgroundColor: isDark ? '#0e0e0e' : colors.shellElevated,
    }),
    [colors, isDark],
  );

  if (isLoading) {
    return <LinkStatsSkeleton />;
  }

  const header = (
    <View style={styles.statsBlock}>
      <View style={styles.topRow}>
        <AppText style={[styles.viewsValue, { color: colors.text }]}>
          {businessError || linkSectionDegraded ? '0' : (viewsDisplay ?? '0')}
        </AppText>
        {onPeriodChange ? (
          <LinkViewsPeriodPicker
            disabled={Boolean(businessError || linkSectionDegraded)}
            hasProAccess={hasProAccess}
            onPeriodChange={onPeriodChange}
            period={period}
          />
        ) : null}
      </View>
      <View style={styles.metaRow}>
        <AppText numberOfLines={1} style={[styles.periodCaption, { color: colors.textMuted }]}>
          {periodLabel}
        </AppText>
        {showLastVisit ? (
          <AppText numberOfLines={1} style={[styles.lastVisitCaption, { color: colors.textMuted }]}>
            {lastVisitRelative}
          </AppText>
        ) : null}
      </View>
    </View>
  );

  if (businessError || linkSectionDegraded) {
    return (
      <SurfaceCard outlined={false} padding="none" style={styles.card}>
        <View style={styles.inner}>
          {header}
          {businessError ? (
            <View style={styles.errorWrap}>
              <InlineCardError message={businessError} />
            </View>
          ) : null}
          <View style={[styles.linkRow, linkWellStyle, styles.linkRowMuted]}>
            <AppText style={[styles.linkUnavailable, { color: colors.textMuted }]}>
              Link unavailable until your business profile loads.
            </AppText>
          </View>
        </View>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard outlined={false} padding="none" style={styles.card}>
      <View style={styles.inner}>
        {header}
        {viewsError ? (
          <View style={styles.errorWrap}>
            <InlineCardError message={viewsError} />
          </View>
        ) : null}
        <Pressable
          accessibilityHint={hasSlug ? 'Copies your booking link' : undefined}
          accessibilityLabel={
            hasSlug
              ? copied
                ? 'Link copied'
                : 'Copy booking link'
              : 'No booking link. Set business slug in your dashboard.'
          }
          accessibilityRole="button"
          accessibilityState={{ disabled: !hasSlug }}
          disabled={!hasSlug}
          onPress={handleCopy}
          style={({ pressed }) => [
            !hasSlug && styles.copyDisabled,
            pressed && hasSlug ? { opacity: 0.85 } : null,
          ]}
        >
          <View style={[styles.linkRow, linkWellStyle]}>
            <View style={styles.linkTextWrap}>
              <AppText
                ellipsizeMode="tail"
                numberOfLines={1}
                style={[
                  hasSlug ? styles.linkText : styles.linkPlaceholder,
                  hasSlug
                    ? {
                        color: colors.textSecondary,
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
            <View pointerEvents="none" style={styles.copyHit}>
              <Ionicons
                color={copied ? colors.text : colors.textMuted}
                name={copied ? 'checkmark' : 'copy-outline'}
                size={14}
              />
            </View>
          </View>
        </Pressable>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
  },
  inner: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: '100%',
  },
  statsBlock: {
    marginBottom: 12,
    width: '100%',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 6,
    width: '100%',
  },
  viewsValue: {
    flex: 1,
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: -0.9,
    lineHeight: 34,
    minWidth: 0,
  },
  viewsSkeleton: {
    flex: 1,
    maxWidth: 80,
    minWidth: 0,
  },
  periodCaption: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
    lineHeight: 16,
    minWidth: 0,
  },
  lastVisitCaption: {
    flexShrink: 0,
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '500',
    letterSpacing: -0.1,
    lineHeight: 16,
    marginTop: 2,
    textAlign: 'right',
  },
  periodSkeleton: {
    marginTop: 2,
  },
  errorWrap: {
    marginBottom: 10,
  },
  linkRow: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 12,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
    minHeight: 40,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 8,
    width: '100%',
  },
  linkRowMuted: {
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  linkTextWrap: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  linkTextSkeleton: {
    flex: 1,
    minWidth: 0,
  },
  linkUnavailable: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
    width: '100%',
  },
  linkText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.15,
    width: '100%',
  },
  linkPlaceholder: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    width: '100%',
  },
  copyHit: {
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  copyDisabled: {
    opacity: 0.35,
  },
});
