import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { formatDaysSinceLastVisitCompact } from '../utils/formatDaysSinceLastVisit';

/** Wider than tall — a bit taller so last-visit date + relative line fit inside the panel. */
const CARD_ASPECT = 1.28;

/** Fixed slots so captions line up across cards. */
const CAPTION_SLOT_MIN_HEIGHT = 30;
/** Primary value row: first lines of values line up; fits two lines at 17px on spend/visits. */
const VALUE_PRIMARY_MIN_HEIGHT = 44;

function AtAGlanceMetricCard({ caption, shrinkValue, subtitle, value }) {
  const { colors } = useTheme();
  const hasSubtitle = typeof subtitle === 'string';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          aspectRatio: CARD_ASPECT,
          flex: 1,
          minWidth: 0,
        },
        card: {
          flex: 1,
        },
        cardInset: {
          paddingBottom: 8,
          paddingTop: 6,
        },
        inner: {
          alignItems: 'stretch',
          flex: 1,
          justifyContent: 'center',
          paddingBottom: 0,
          paddingTop: 0,
          width: '100%',
        },
        /** Wraps label + values so the block can sit vertically centered in the card. */
        contentCenter: {
          width: '100%',
        },
        labelShell: {
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 3,
          minHeight: CAPTION_SLOT_MIN_HEIGHT,
          width: '100%',
        },
        /** Top-aligned so Visits / spend / date share one horizontal band (first line). */
        valueRow: {
          alignItems: 'center',
          justifyContent: 'flex-start',
          minHeight: VALUE_PRIMARY_MIN_HEIGHT,
          width: '100%',
        },
        /** Date + relative line stacked with no gap from valueRow minHeight between them. */
        valueStackTight: {
          alignItems: 'center',
          alignSelf: 'stretch',
          width: '100%',
        },
        caption: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.12,
          textAlign: 'center',
          width: '100%',
        },
        valueText: {
          alignSelf: 'stretch',
          color: colors.text,
          fontSize: 17,
          fontWeight: '600',
          letterSpacing: -0.32,
          lineHeight: 22,
          textAlign: 'center',
          width: '100%',
        },
        /** Last visit date only — smaller so date + relative line stay inside the card. */
        valueTextLastVisit: {
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: -0.22,
          lineHeight: 18,
        },
        subtitle: {
          alignSelf: 'stretch',
          color: colors.placeholder,
          fontSize: 10,
          fontWeight: '400',
          letterSpacing: 0.04,
          lineHeight: 13,
          marginTop: 5,
          textAlign: 'center',
          width: '100%',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <SurfaceCard padding="sm" style={[styles.card, styles.cardInset]}>
        <View style={styles.inner}>
          <View style={styles.contentCenter}>
            <View style={styles.labelShell}>
              <AppText numberOfLines={2} style={styles.caption}>
                {caption}
              </AppText>
            </View>
            <View style={styles.valueRow}>
              {hasSubtitle ? (
                <View style={styles.valueStackTight}>
                  <AppText
                    adjustsFontSizeToFit={Boolean(shrinkValue)}
                    includeFontPadding={Platform.OS === 'android' ? false : undefined}
                    minimumFontScale={shrinkValue ? 0.7 : undefined}
                    numberOfLines={2}
                    style={[styles.valueText, shrinkValue ? styles.valueTextLastVisit : null]}
                  >
                    {value}
                  </AppText>
                  <AppText
                    includeFontPadding={Platform.OS === 'android' ? false : undefined}
                    numberOfLines={2}
                    style={styles.subtitle}
                  >
                    {subtitle}
                  </AppText>
                </View>
              ) : (
                <AppText
                  adjustsFontSizeToFit={Boolean(shrinkValue)}
                  minimumFontScale={shrinkValue ? 0.7 : undefined}
                  numberOfLines={2}
                  style={[styles.valueText, shrinkValue ? styles.valueTextLastVisit : null]}
                >
                  {value}
                </AppText>
              )}
            </View>
          </View>
        </View>
      </SurfaceCard>
    </View>
  );
}

export function CustomerStatsSection({
  lastVisitAtIso,
  lastVisitLabel,
  lastVisitRelativeLabel,
  totalSpendLabel,
  totalVisitsLabel,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          rowGap: 8,
        },
        title: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        cardsRow: {
          alignItems: 'stretch',
          flexDirection: 'row',
          gap: 12,
        },
      }),
    [colors],
  );

  const hasLastVisit = useMemo(() => {
    if (typeof lastVisitAtIso === 'string' && lastVisitAtIso.trim().length > 0) {
      return true;
    }
    return (
      typeof lastVisitLabel === 'string' &&
      lastVisitLabel.trim().length > 0 &&
      lastVisitLabel.trim() !== '—'
    );
  }, [lastVisitAtIso, lastVisitLabel]);

  const lastVisitValue = hasLastVisit ? lastVisitLabel : 'No visits';

  const lastVisitDaysAgo = useMemo(() => {
    if (!hasLastVisit) {
      return null;
    }
    const fromProp =
      typeof lastVisitRelativeLabel === 'string' ? lastVisitRelativeLabel.trim() : '';
    if (fromProp.length > 0) {
      return fromProp;
    }
    const iso =
      typeof lastVisitAtIso === 'string' && lastVisitAtIso.trim().length > 0
        ? lastVisitAtIso.trim()
        : null;
    if (iso) {
      const fromDate = formatDaysSinceLastVisitCompact(iso).trim();
      if (fromDate.length > 0) {
        return fromDate;
      }
    }
    return null;
  }, [hasLastVisit, lastVisitAtIso, lastVisitRelativeLabel]);

  return (
    <View style={styles.section}>
      <AppText style={styles.title}>Activity</AppText>
      <View style={styles.cardsRow}>
        <AtAGlanceMetricCard caption="Visits" value={totalVisitsLabel} />
        <AtAGlanceMetricCard caption="Total spend" value={totalSpendLabel} />
        <AtAGlanceMetricCard
          caption="Last visit"
          shrinkValue
          subtitle={lastVisitDaysAgo}
          value={lastVisitValue}
        />
      </View>
    </View>
  );
}
