import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, DetailIconFieldRow, DetailsSectionCard, Divider } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { getQuoteStatusPillTheme } from '../utils/quoteStatusPillTheme';

/**
 * @param {object} props
 * @param {{
 *   serviceTitle?: string;
 *   priceFormatted?: string | null;
 *   durationLabel?: string | null;
 *   statusLabel?: string;
 *   statusRaw?: string;
 *   sentAt?: string;
 *   goodUntil?: string;
 *   linkHint?: string;
 * }} props.model
 * @param {import('react').ReactNode} [props.betweenProposalAndActivity] Rendered between Proposal and Activity (e.g. customer `InfoSection`).
 */
export function SentQuoteDetailBody({ model, betweenProposalAndActivity = null }) {
  const { colors, isDark } = useTheme();

  const pillTheme = useMemo(
    () => getQuoteStatusPillTheme(model.statusRaw, colors, isDark),
    [colors, isDark, model.statusRaw],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        sectionsColumn: {
          gap: 22,
        },
        proposalInner: {
          paddingVertical: 4,
        },
        serviceTitle: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 22,
          letterSpacing: -0.35,
          lineHeight: 28,
        },
        price: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 30,
          letterSpacing: -0.6,
          lineHeight: 36,
          marginTop: 8,
        },
        pillRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 16,
        },
        pill: {
          alignSelf: 'flex-start',
          borderRadius: 999,
          borderWidth: 1,
          paddingHorizontal: 12,
          paddingVertical: 6,
        },
        pillText: {
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          letterSpacing: 0.15,
        },
        durationRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          marginTop: 14,
        },
        durationText: {
          color: colors.textMuted,
          flex: 1,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 20,
        },
        activityStack: {
          gap: 18,
          paddingTop: 4,
        },
        linkCallout: {
          backgroundColor: isDark ? 'rgba(250,250,250,0.05)' : 'rgba(10,10,10,0.04)',
          borderColor: colors.border,
          borderRadius: 12,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        linkCalloutIcon: {
          paddingTop: 2,
        },
        linkCalloutTitle: {
          color: colors.textMuted,
          fontSize: 11,
          fontFamily: FONT_FAMILIES.semibold,
          fontWeight: '600',
          letterSpacing: 0.35,
          marginBottom: 6,
          textTransform: 'uppercase',
        },
        linkCalloutBody: {
          color: colors.textSecondary,
          fontSize: 15,
          fontFamily: FONT_FAMILIES.medium,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 22,
        },
      }),
    [colors, isDark],
  );

  const serviceHeadline =
    model.serviceTitle?.trim() || (model.priceFormatted ? 'Quoted service' : 'Quote');

  const expiresCopy =
    model.goodUntil !== '—'
      ? `Good through ${model.goodUntil}`
      : 'No active expiry date on the customer link';

  return (
    <View style={styles.sectionsColumn}>
      <DetailsSectionCard title="Proposal">
        <View style={styles.proposalInner}>
          <AppText style={styles.serviceTitle}>{serviceHeadline}</AppText>
          {model.priceFormatted ? (
            <AppText style={styles.price}>{model.priceFormatted}</AppText>
          ) : (
            <AppText style={[styles.price, { fontSize: 17, opacity: 0.85 }]}>Price not set</AppText>
          )}

          <View style={styles.pillRow}>
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: pillTheme.backgroundColor,
                  borderColor: pillTheme.borderColor,
                },
              ]}
            >
              <AppText style={[styles.pillText, { color: pillTheme.color }]}>
                {model.statusLabel ?? '—'}
              </AppText>
            </View>
          </View>

          {model.durationLabel ? (
            <View style={styles.durationRow}>
              <Ionicons color={colors.textMuted} name="timer-outline" size={18} />
              <AppText style={styles.durationText}>
                Estimated duration · {model.durationLabel}
              </AppText>
            </View>
          ) : null}
        </View>
      </DetailsSectionCard>

      {betweenProposalAndActivity}

      <DetailsSectionCard title="Activity">
        <View style={styles.activityStack}>
          <DetailIconFieldRow icon="paper-plane-outline" label="Sent" value={model.sentAt ?? '—'} />
          <DetailIconFieldRow icon="hourglass-outline" label="Link" value={expiresCopy} />

          <Divider />

          <View style={styles.linkCallout}>
            <View style={styles.linkCalloutIcon}>
              <Ionicons color={colors.accent} name="link-outline" size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={styles.linkCalloutTitle}>Customer</AppText>
              <AppText style={styles.linkCalloutBody}>{model.linkHint ?? '—'}</AppText>
            </View>
          </View>
        </View>
      </DetailsSectionCard>
    </View>
  );
}
