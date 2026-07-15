import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  DetailIconFieldRow,
  DetailsSectionCard,
  Divider,
  InfoSection,
} from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { getQuoteStatusPillTheme } from '../utils/quoteStatusPillTheme';

/**
 * @param {object} props
 * @param {{
 *   serviceTitle?: string;
 *   pricingOptionLabel?: string | null;
 *   servicePriceFormatted?: string | null;
 *   addonDetails?: Array<{ id: string; name: string; priceFormatted: string }>;
 *   priceFormatted?: string | null;
 *   durationLabel?: string | null;
 *   statusLabel?: string;
 *   statusRaw?: string;
 *   sentAt?: string;
 *   goodUntil?: string;
 *   linkHint?: string;
 *   scheduleLabel?: string;
 *   scheduleState?: 'customer' | 'scheduled' | 'incomplete';
 *   scheduleDateLabel?: string | null;
 *   scheduleTimeLabel?: string | null;
 *   note?: string;
 *   serviceAddressLine?: string;
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
          paddingVertical: 2,
        },
        proposalHeader: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
        },
        serviceTitle: {
          color: colors.text,
          flex: 1,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 18,
          letterSpacing: -0.3,
          lineHeight: 24,
          minWidth: 0,
        },
        serviceHeading: {
          flex: 1,
          minWidth: 0,
        },
        optionLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          marginTop: 3,
        },
        price: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 26,
          letterSpacing: -0.5,
          lineHeight: 32,
          marginTop: 12,
        },
        pill: {
          borderRadius: 999,
          borderWidth: 1,
          flexShrink: 0,
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        pillText: {
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 10,
          letterSpacing: 0.05,
        },
        lineItems: {
          marginTop: 16,
        },
        lineRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'space-between',
          marginBottom: 10,
        },
        lineName: {
          color: colors.textSecondary,
          flex: 1,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          lineHeight: 19,
          minWidth: 0,
        },
        lineValue: {
          color: colors.textSecondary,
          flexShrink: 0,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
          lineHeight: 19,
        },
        totalDivider: {
          marginBottom: 12,
          marginTop: 2,
        },
        totalRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        totalLabel: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
        },
        totalValue: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 22,
          letterSpacing: -0.35,
        },
        scheduleStack: {
          gap: 16,
          paddingTop: 2,
        },
        noteText: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          lineHeight: 22,
          paddingVertical: 2,
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
  const addonDetails = Array.isArray(model.addonDetails) ? model.addonDetails : [];
  const hasAddons = addonDetails.length > 0;
  const hasScheduleDate = Boolean(model.scheduleDateLabel);
  const hasScheduleTime = Boolean(model.scheduleTimeLabel);
  const showScheduleSection =
    model.scheduleState === 'customer' ||
    hasScheduleDate ||
    hasScheduleTime ||
    Boolean(model.durationLabel);
  const hasSentAt = Boolean(model.sentAt && model.sentAt !== '—');
  const hasLinkHint = Boolean(model.linkHint && model.linkHint !== '—');

  const expiresCopy =
    model.goodUntil && model.goodUntil !== '—' ? `Good through ${model.goodUntil}` : null;
  const showActivitySection = hasSentAt || Boolean(expiresCopy) || hasLinkHint;

  return (
    <View style={styles.sectionsColumn}>
      <DetailsSectionCard title="Proposal">
        <View style={styles.proposalInner}>
          <View style={styles.proposalHeader}>
            <View style={styles.serviceHeading}>
              <AppText style={styles.serviceTitle}>{serviceHeadline}</AppText>
              {model.pricingOptionLabel ? (
                <AppText style={styles.optionLabel}>{model.pricingOptionLabel}</AppText>
              ) : null}
            </View>
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

          {hasAddons ? (
            <>
              <View style={styles.lineItems}>
                {model.servicePriceFormatted ? (
                  <View style={styles.lineRow}>
                    <AppText numberOfLines={2} style={styles.lineName}>
                      {serviceHeadline}
                    </AppText>
                    <AppText style={styles.lineValue}>{model.servicePriceFormatted}</AppText>
                  </View>
                ) : null}
                {addonDetails.map((addon) => (
                  <View key={addon.id} style={styles.lineRow}>
                    <AppText numberOfLines={2} style={styles.lineName}>
                      {addon.name}
                    </AppText>
                    <AppText style={styles.lineValue}>{addon.priceFormatted}</AppText>
                  </View>
                ))}
              </View>
              {model.priceFormatted ? (
                <>
                  <Divider style={styles.totalDivider} />
                  <View style={styles.totalRow}>
                    <AppText style={styles.totalLabel}>Total</AppText>
                    <AppText style={styles.totalValue}>{model.priceFormatted}</AppText>
                  </View>
                </>
              ) : null}
            </>
          ) : model.priceFormatted ? (
            <AppText style={styles.price}>{model.priceFormatted}</AppText>
          ) : null}
        </View>
      </DetailsSectionCard>

      {showScheduleSection ? (
        <DetailsSectionCard title="Schedule">
          <View style={styles.scheduleStack}>
            {model.scheduleState === 'customer' ? (
              <DetailIconFieldRow
                icon="calendar-outline"
                label="Date & time"
                labelUppercase={false}
                value={model.scheduleLabel}
              />
            ) : (
              <>
                {hasScheduleDate ? (
                  <DetailIconFieldRow
                    icon="calendar-outline"
                    label="Date"
                    labelUppercase={false}
                    value={model.scheduleDateLabel}
                  />
                ) : null}
                {hasScheduleTime ? (
                  <DetailIconFieldRow
                    icon="time-outline"
                    label="Time"
                    labelUppercase={false}
                    value={model.scheduleTimeLabel}
                  />
                ) : null}
              </>
            )}
            {model.durationLabel ? (
              <DetailIconFieldRow
                icon="hourglass-outline"
                label="Duration"
                labelUppercase={false}
                value={model.durationLabel}
              />
            ) : null}
          </View>
        </DetailsSectionCard>
      ) : null}

      {betweenProposalAndActivity}

      {model.serviceAddressLine ? (
        <InfoSection
          bodyPadding="roomy"
          rowGap={14}
          rows={[{ icon: 'location-outline', value: model.serviceAddressLine }]}
          title="Location"
        />
      ) : null}

      {model.note ? (
        <DetailsSectionCard title="Note">
          <AppText style={styles.noteText}>{model.note}</AppText>
        </DetailsSectionCard>
      ) : null}

      {showActivitySection ? (
        <DetailsSectionCard title="Activity">
          <View style={styles.activityStack}>
            {hasSentAt ? (
              <DetailIconFieldRow icon="paper-plane-outline" label="Sent" value={model.sentAt} />
            ) : null}
            {expiresCopy ? (
              <DetailIconFieldRow icon="hourglass-outline" label="Link" value={expiresCopy} />
            ) : null}

            {hasLinkHint && (hasSentAt || expiresCopy) ? <Divider /> : null}

            {hasLinkHint ? (
              <View style={styles.linkCallout}>
                <View style={styles.linkCalloutIcon}>
                  <Ionicons color={colors.accent} name="link-outline" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={styles.linkCalloutTitle}>Customer</AppText>
                  <AppText style={styles.linkCalloutBody}>{model.linkHint}</AppText>
                </View>
              </View>
            ) : null}
          </View>
        </DetailsSectionCard>
      ) : null}
    </View>
  );
}
