import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import {
  AppText,
  AppTextInput,
  DetailsSectionCard,
  Divider,
  InfoSection,
} from '../../../../components/ui';
import {
  formatServiceDurationSelectLabel,
  isValidServiceDurationHHmm,
} from '../../../../components/ui/durationTime';
import { QUOTE_NOTE_MAX } from '../../constants/createQuoteFieldLimits';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { canonicalNanpDigits, formatPhoneForDisplay } from '../../../../utils/phone';
import { splitBookingServiceName } from '../../../../utils/splitBookingServiceName';
import {
  formatScheduledDateUserFacing,
  isValidCalendarYyyyMmDd,
} from '../../utils/formatScheduledDateDisplay';

/**
 * Review step for create-quote: proposal, schedule, customer, vehicle, notes.
 *
 * @param {object} props
 * @param {string} props.customerName
 * @param {string} props.customerEmail
 * @param {string} props.customerPhoneDisplay
 * @param {string} props.vehicleYear
 * @param {string} props.vehicleMake
 * @param {string} props.vehicleModel
 * @param {string} props.serviceName
 * @param {string} props.priceUsdText
 * @param {string} props.durationHhMm
 * @param {string | null} [props.pricingOptionLabel]
 * @param {Array<{ id: string; name: string; priceLabel?: string }> | null} [props.addonLines]
 * @param {'unset' | 'pick' | 'customer'} [props.scheduleMode]
 * @param {string} props.scheduledDateYyyyMmDd
 * @param {string} props.scheduledStartTime12h
 * @param {string} props.customerRequestNotes From the quote request (read-only).
 * @param {string} props.businessNote Shown on the sent quote (`body.note`).
 * @param {(t: string) => void} props.onBusinessNoteChange
 */
export function CreateQuoteStepReview({
  customerName,
  customerEmail,
  customerPhoneDisplay,
  vehicleYear,
  vehicleMake,
  vehicleModel,
  serviceName,
  priceUsdText,
  durationHhMm,
  pricingOptionLabel = null,
  addonLines = null,
  scheduleMode = 'unset',
  scheduledDateYyyyMmDd,
  scheduledStartTime12h,
  customerRequestNotes,
  businessNote,
  onBusinessNoteChange,
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

  const phoneDigits10 = useMemo(() => {
    const d = canonicalNanpDigits(customerPhoneDisplay);
    return d.length === 10 ? d : null;
  }, [customerPhoneDisplay]);

  const phoneLine = useMemo(
    () => (phoneDigits10 ? formatPhoneForDisplay(phoneDigits10) : null),
    [phoneDigits10],
  );

  const vehicleLine = useMemo(() => {
    const parts = [vehicleYear, vehicleMake, vehicleModel]
      .map((x) => String(x ?? '').trim())
      .filter(Boolean);
    return parts.length ? parts.join(' ') : '';
  }, [vehicleMake, vehicleModel, vehicleYear]);

  const hasVehicle = vehicleLine.length > 0;

  const scheduleDateDisplay = useMemo(() => {
    const raw = String(scheduledDateYyyyMmDd ?? '').trim();
    if (!isValidCalendarYyyyMmDd(raw)) return null;
    return formatScheduledDateUserFacing(raw) || null;
  }, [scheduledDateYyyyMmDd]);

  const scheduleTimeDisplay = useMemo(() => {
    const t = String(scheduledStartTime12h ?? '').trim();
    return t.length > 0 ? t : null;
  }, [scheduledStartTime12h]);

  const showScheduleSection =
    scheduleMode === 'customer' || Boolean(scheduleDateDisplay || scheduleTimeDisplay);

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
    if (phoneLine && phoneDigits10) {
      rows.push({
        key: 'phone',
        icon: 'call-outline',
        value: phoneLine,
        accessibilityLabel: `Call ${phoneLine}`,
        onPress: () => {
          void Linking.openURL(`tel:+1${phoneDigits10}`);
        },
      });
    }
    const email = customerEmail.trim();
    if (email) {
      rows.push({ key: 'email', icon: 'mail-outline', value: email });
    }
    return rows;
  }, [customerEmail, customerName, phoneDigits10, phoneLine]);

  const showCustomerSection = customerRows.length > 0;
  const customerRequestNotesTrimmed = String(customerRequestNotes ?? '').trim();
  const optionLine = String(pricingOptionLabel ?? '').trim();
  const serviceNameTrimmed = serviceName.trim() || 'Quoted service';
  const serviceHeadline = optionLine
    ? splitBookingServiceName(serviceNameTrimmed).primary
    : serviceNameTrimmed;
  const reviewAddons = Array.isArray(addonLines) ? addonLines : [];
  const hasAddons = reviewAddons.length > 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        reviewRoot: {
          gap: 22,
        },
        heroBlock: {
          marginBottom: 6,
        },
        heroHeadline: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 22,
          letterSpacing: -0.35,
          lineHeight: 28,
          marginBottom: 3,
        },
        heroSub: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 21,
        },
        heroDivider: {
          marginTop: 9,
        },
        proposalInner: {
          paddingVertical: 2,
        },
        serviceTitle: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 18,
          letterSpacing: -0.3,
          lineHeight: 24,
        },
        optionLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 20,
          marginTop: 4,
        },
        lineItems: {
          marginTop: 14,
        },
        lineRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
        },
        lineName: {
          color: colors.textSecondary,
          flex: 1,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          marginRight: 12,
        },
        linePrice: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '600',
        },
        dividerWrap: {
          marginBottom: 12,
          marginTop: 4,
        },
        totalRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        totalLabel: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          letterSpacing: -0.2,
        },
        totalValue: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 22,
          letterSpacing: -0.4,
        },
        priceOnly: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 28,
          letterSpacing: -0.5,
          lineHeight: 34,
          marginTop: 10,
        },
        metaRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          marginTop: 12,
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
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginBottom: 4,
          textTransform: 'uppercase',
        },
        activityValue: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.15,
          lineHeight: 22,
        },
        vehicleRow: {
          flexDirection: 'row',
          gap: 14,
          paddingTop: 2,
        },
        vehicleTextWrap: {
          flex: 1,
          paddingTop: 1,
        },
        vehicleBody: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.15,
          lineHeight: 22,
        },
        noteInput: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 16,
          fontWeight: '400',
          letterSpacing: -0.15,
          lineHeight: 24,
          minHeight: 132,
          paddingBottom: 4,
          paddingTop: 4,
          textAlignVertical: 'top',
        },
        notesStack: {
          gap: 0,
          paddingVertical: 2,
        },
        noteSectionLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginBottom: 8,
        },
        noteReadonlyBody: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 22,
        },
        notesDividerWrap: {
          marginVertical: 16,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.reviewRoot}>
      <View style={styles.heroBlock}>
        <AppText style={styles.heroHeadline}>Review quote</AppText>
        <AppText style={styles.heroSub}>Review the details, then send.</AppText>
        <Divider style={styles.heroDivider} />
      </View>

      <DetailsSectionCard title="Proposal">
        <View style={styles.proposalInner}>
          <AppText style={styles.serviceTitle}>{serviceHeadline}</AppText>
          {optionLine ? <AppText style={styles.optionLabel}>{optionLine}</AppText> : null}

          {hasAddons ? (
            <>
              <View style={styles.lineItems}>
                {reviewAddons.map((a) => (
                  <View key={a.id} style={styles.lineRow}>
                    <AppText numberOfLines={2} style={styles.lineName}>
                      {a.name}
                    </AppText>
                    {a.priceLabel ? (
                      <AppText style={styles.linePrice}>{a.priceLabel}</AppText>
                    ) : null}
                  </View>
                ))}
              </View>
              <View style={styles.dividerWrap}>
                <Divider />
              </View>
              <View style={styles.totalRow}>
                <AppText style={styles.totalLabel}>Total</AppText>
                <AppText style={styles.totalValue}>{priceDisplay || '—'}</AppText>
              </View>
            </>
          ) : priceDisplay ? (
            <AppText style={styles.priceOnly}>{priceDisplay}</AppText>
          ) : (
            <AppText style={[styles.priceOnly, { fontSize: 17, opacity: 0.85 }]}>
              Price not set
            </AppText>
          )}

          {durationLabel ? (
            <View style={styles.metaRow}>
              <Ionicons color={colors.textMuted} name="timer-outline" size={18} />
              <AppText style={styles.metaText}>Duration · {durationLabel}</AppText>
            </View>
          ) : null}
        </View>
      </DetailsSectionCard>

      {showScheduleSection ? (
        <DetailsSectionCard title="Schedule">
          <View style={styles.activityStack}>
            {scheduleMode === 'customer' ? (
              <View style={styles.activityRow}>
                <View style={styles.activityIconWrap}>
                  <Ionicons color={colors.accentMuted} name="calendar-outline" size={19} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={styles.activityLabel}>Date & time</AppText>
                  <AppText style={styles.activityValue}>Customer will choose</AppText>
                </View>
              </View>
            ) : (
              <>
                {scheduleDateDisplay ? (
                  <View style={styles.activityRow}>
                    <View style={styles.activityIconWrap}>
                      <Ionicons color={colors.accentMuted} name="calendar-outline" size={19} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText style={styles.activityLabel}>Date</AppText>
                      <AppText style={styles.activityValue}>{scheduleDateDisplay}</AppText>
                    </View>
                  </View>
                ) : null}
                {scheduleTimeDisplay ? (
                  <View style={styles.activityRow}>
                    <View style={styles.activityIconWrap}>
                      <Ionicons color={colors.accentMuted} name="time-outline" size={19} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText style={styles.activityLabel}>Time</AppText>
                      <AppText style={styles.activityValue}>{scheduleTimeDisplay}</AppText>
                    </View>
                  </View>
                ) : null}
              </>
            )}
          </View>
        </DetailsSectionCard>
      ) : null}

      {showCustomerSection ? (
        <InfoSection rowGap={14} rows={customerRows} title="Customer" />
      ) : null}

      {hasVehicle ? (
        <DetailsSectionCard title="Vehicle">
          <View style={styles.vehicleRow}>
            <View style={styles.activityIconWrap}>
              <Ionicons color={colors.accentMuted} name="car-sport" size={21} />
            </View>
            <View style={styles.vehicleTextWrap}>
              <AppText style={styles.vehicleBody}>{vehicleLine}</AppText>
            </View>
          </View>
        </DetailsSectionCard>
      ) : null}

      <DetailsSectionCard title="Notes">
        <View style={styles.notesStack}>
          {customerRequestNotesTrimmed ? (
            <>
              <View>
                <AppText style={styles.noteSectionLabel}>Customer notes</AppText>
                <AppText style={styles.noteReadonlyBody}>{customerRequestNotesTrimmed}</AppText>
              </View>
              <View style={styles.notesDividerWrap}>
                <Divider />
              </View>
            </>
          ) : null}
          <View>
            <AppText style={styles.noteSectionLabel}>Business notes</AppText>
            <AppTextInput
              autoCapitalize="sentences"
              maxLength={QUOTE_NOTE_MAX}
              multiline
              onChangeText={onBusinessNoteChange}
              placeholder="Optional — appears on the quote you send…"
              placeholderTextColor={colors.placeholder}
              style={styles.noteInput}
              textAlignVertical="top"
              value={businessNote}
            />
          </View>
        </View>
      </DetailsSectionCard>
    </View>
  );
}
