import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard, InfoSection } from '../../../../components/ui';
import {
  formatServiceDurationSelectLabel,
  isValidServiceDurationHHmm,
} from '../../../../components/ui/durationTime';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { formatPreferredDateMmDdYyyy } from '../utils/formatPreferredDateDisplay';

/**
 * @param {object} props
 * @param {string} props.customerName
 * @param {string} props.customerEmail
 * @param {string} props.priceUsdText
 * @param {string} props.durationHhMm
 * @param {string} props.preferredDateYyyyMmDd
 * @param {string} props.preferredTime12h
 */
export function MaintenanceInviteStepReview({
  customerName,
  customerEmail,
  priceUsdText,
  durationHhMm,
  preferredDateYyyyMmDd,
  preferredTime12h,
}) {
  const { colors } = useTheme();

  const priceDisplay = useMemo(() => {
    const raw = String(priceUsdText ?? '')
      .replace(/\$/g, '')
      .trim();
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return null;
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
  }, [priceUsdText]);

  const durationLabel = useMemo(() => {
    if (!isValidServiceDurationHHmm(durationHhMm)) return null;
    const label = formatServiceDurationSelectLabel(durationHhMm);
    return String(label ?? '').trim() || null;
  }, [durationHhMm]);

  const preferredDateDisplay = useMemo(
    () => formatPreferredDateMmDdYyyy(preferredDateYyyyMmDd),
    [preferredDateYyyyMmDd],
  );

  const preferredTimeDisplay = useMemo(() => {
    const t = String(preferredTime12h ?? '').trim();
    return t.length > 0 ? t : null;
  }, [preferredTime12h]);

  const showScheduleSection = Boolean(preferredDateDisplay);

  const customerRows = useMemo(() => {
    const rows = [];
    const name = customerName.trim();
    if (name) {
      rows.push({
        key: 'name',
        icon: 'person-outline',
        value: name,
        emphasize: true,
      });
    }
    const email = customerEmail.trim();
    if (email) {
      rows.push({ key: 'email', icon: 'mail-outline', value: email });
    }
    return rows;
  }, [customerEmail, customerName]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        reviewRoot: {
          gap: 22,
        },
        heroHeadline: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 22,
          letterSpacing: -0.35,
          lineHeight: 28,
          marginBottom: 8,
        },
        heroSub: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 21,
          marginBottom: 4,
        },
        proposalInner: {
          paddingVertical: 4,
        },
        planTitle: {
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
        metaRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          marginTop: 14,
        },
        metaText: {
          color: colors.textMuted,
          flex: 1,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 20,
        },
        activityStack: {
          gap: 16,
          paddingTop: 2,
        },
        activityRow: {
          flexDirection: 'row',
          gap: 14,
        },
        activityIconWrap: {
          paddingTop: 2,
          width: 22,
        },
        activityLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.1,
          marginBottom: 4,
        },
        activityValue: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.15,
          lineHeight: 22,
        },
        footnote: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '400',
          letterSpacing: -0.05,
          lineHeight: 21,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.reviewRoot}>
      <View>
        <AppText style={styles.heroHeadline}>Review offer</AppText>
        <AppText style={styles.heroSub}>
          Your customer gets a link to review the service, pay, and confirm.
        </AppText>
      </View>

      <DetailsSectionCard title="Maintenance service">
        <View style={styles.proposalInner}>
          <AppText style={styles.planTitle}>Service details</AppText>
          {priceDisplay ? (
            <AppText style={styles.price}>{priceDisplay}</AppText>
          ) : (
            <AppText style={[styles.price, { fontSize: 17, opacity: 0.85 }]}>Price not set</AppText>
          )}
          {durationLabel ? (
            <View style={styles.metaRow}>
              <Ionicons color={colors.textMuted} name="timer-outline" size={18} />
              <AppText style={styles.metaText}>Service duration · {durationLabel}</AppText>
            </View>
          ) : null}
        </View>
      </DetailsSectionCard>

      {showScheduleSection ? (
        <DetailsSectionCard title="Date and time">
          <View style={styles.activityStack}>
            {preferredDateDisplay ? (
              <View style={styles.activityRow}>
                <View style={styles.activityIconWrap}>
                  <Ionicons color={colors.accentMuted} name="calendar-outline" size={19} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={styles.activityLabel}>Date</AppText>
                  <AppText style={styles.activityValue}>{preferredDateDisplay}</AppText>
                </View>
              </View>
            ) : null}
            {preferredTimeDisplay ? (
              <View style={styles.activityRow}>
                <View style={styles.activityIconWrap}>
                  <Ionicons color={colors.accentMuted} name="time-outline" size={19} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={styles.activityLabel}>Time</AppText>
                  <AppText style={styles.activityValue}>{preferredTimeDisplay}</AppText>
                </View>
              </View>
            ) : null}
          </View>
        </DetailsSectionCard>
      ) : null}

      {customerRows.length > 0 ? (
        <InfoSection rowGap={14} rows={customerRows} title="Customer" />
      ) : null}

      <AppText style={styles.footnote}>
        No customer email? Copy the link on the next screen.
      </AppText>
    </View>
  );
}
