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
      backgroundColor: isDark ? colors.surface : colors.shellElevated,
      borderColor: colors.border,
    }),
    [colors, isDark],
  );

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.statsBlock}>
        <View style={styles.topRow}>
          <SkeletonBox borderRadius={10} height={28} pulse width={48} />
          <SkeletonBox borderRadius={10} height={30} pulse width={92} />
        </View>
        <View style={styles.metaRow}>
          <SkeletonBox borderRadius={6} height={13} pulse width={100} />
          <SkeletonBox borderRadius={6} height={11} pulse width={56} />
        </View>
      </View>
      <View style={[styles.linkWell, wellBg, styles.linkWellSpacing]}>
        <SkeletonBox borderRadius={8} height={16} pulse width="72%" />
        <SkeletonBox borderRadius={12} height={36} pulse width={40} />
      </View>
    </SurfaceCard>
  );
}

function LinkStatsMetrics({
  viewsDisplay,
  periodLabel,
  lastVisitRelative,
  showLastVisit,
  period,
  onPeriodChange,
  hasProAccess,
  pickerDisabled,
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.statsBlock}>
      <View style={styles.topRow}>
        {viewsDisplay === null ? (
          <SkeletonBox borderRadius={10} height={28} pulse width={48} />
        ) : (
          <AppText style={[styles.viewsValue, { color: colors.text }]}>{viewsDisplay}</AppText>
        )}
        {onPeriodChange ? (
          <LinkViewsPeriodPicker
            disabled={pickerDisabled}
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
      backgroundColor: isDark ? colors.surface : colors.shellElevated,
      borderColor: colors.border,
    }),
    [colors, isDark],
  );

  const metricsProps = {
    viewsDisplay,
    periodLabel,
    lastVisitRelative,
    showLastVisit,
    period,
    onPeriodChange,
    hasProAccess,
    pickerDisabled: false,
  };

  if (isLoading) {
    return <LinkStatsSkeleton />;
  }

  if (businessError || linkSectionDegraded) {
    return (
      <SurfaceCard style={styles.card}>
        <LinkStatsMetrics {...metricsProps} pickerDisabled viewsDisplay="0" />
        {businessError ? (
          <View style={styles.errorWrap}>
            <InlineCardError message={businessError} />
          </View>
        ) : null}
        <View
          style={[styles.linkWell, linkWellStyle, styles.linkWellMuted, styles.linkWellSpacing]}
        >
          <AppText style={[styles.linkUnavailable, { color: colors.textMuted }]}>
            Link unavailable until your business profile loads.
          </AppText>
        </View>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard style={styles.card}>
      <LinkStatsMetrics {...metricsProps} />
      {viewsError ? (
        <View style={styles.errorWrap}>
          <InlineCardError message={viewsError} />
        </View>
      ) : null}
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
            styles.copyButton,
            {
              backgroundColor: pressed ? colors.buttonSecondaryBgPressed : colors.buttonSecondaryBg,
            },
            !hasSlug && styles.copyButtonDisabled,
          ]}
        >
          <Ionicons
            color={colors.buttonSecondaryText}
            name={copied ? 'checkmark' : 'clipboard-outline'}
            size={20}
          />
        </Pressable>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statsBlock: {
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
    fontWeight: '700',
    letterSpacing: -0.7,
    lineHeight: 34,
    minWidth: 0,
  },
  periodCaption: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 17,
    minWidth: 0,
  },
  lastVisitCaption: {
    flexShrink: 0,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 13,
    opacity: 0.85,
    textAlign: 'right',
  },
  errorWrap: {
    marginTop: 10,
  },
  linkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  linkWellSpacing: {
    marginTop: 14,
  },
  linkWell: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 40,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  linkWellMuted: {
    justifyContent: 'center',
  },
  linkUnavailable: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
    width: '100%',
  },
  linkPlaceholder: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    width: '100%',
  },
  copyButton: {
    alignItems: 'center',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 44,
  },
  copyButtonDisabled: {
    opacity: 0.35,
  },
});
