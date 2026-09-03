import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import {
  AppText,
  DetailIconFieldRow,
  DetailsSectionCard,
  Divider,
  InfoSection,
} from '../../../../components/ui';
import {
  formatServiceDurationSelectLabel,
  isValidServiceDurationHHmm,
} from '../../../../components/ui/durationTime';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { canonicalNanpDigits, formatPhoneWithCountryCode } from '../../../../utils/phone';
import { splitBookingServiceName } from '../../../../utils/splitBookingServiceName';
import {
  formatScheduledDateUserFacing,
  isValidCalendarYyyyMmDd,
} from '../../utils/formatScheduledDateDisplay';
import { resolveQuoteRequestBrief } from '../../utils/resolveQuoteRequestBrief';

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
 * @param {string} [props.vehicle2Year]
 * @param {string} [props.vehicle2Make]
 * @param {string} [props.vehicle2Model]
 * @param {string} props.serviceName
 * @param {string} props.priceUsdText
 * @param {string} props.durationHhMm
 * @param {string | null} [props.pricingOptionLabel]
 * @param {Array<{ id: string; name: string; priceLabel?: string }> | null} [props.addonLines]
 * @param {'unset' | 'pick' | 'customer'} [props.scheduleMode]
 * @param {string} props.scheduledDateYyyyMmDd
 * @param {string} props.scheduledStartTime12h
 * @param {string} props.customerRequestNotes From the quote request (read-only).
 * @param {string} props.businessNote From the vehicle step (`body.note`).
 */
export function CreateQuoteStepReview({
  customerName,
  customerEmail,
  customerPhoneDisplay,
  vehicleYear,
  vehicleMake,
  vehicleModel,
  vehicle2Year = '',
  vehicle2Make = '',
  vehicle2Model = '',
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
    () => (phoneDigits10 ? formatPhoneWithCountryCode(phoneDigits10) : null),
    [phoneDigits10],
  );

  const vehicleLines = useMemo(() => {
    return [
      [vehicleYear, vehicleMake, vehicleModel],
      [vehicle2Year, vehicle2Make, vehicle2Model],
    ]
      .map((parts) =>
        parts
          .map((x) => String(x ?? '').trim())
          .filter(Boolean)
          .join(' '),
      )
      .filter(Boolean);
  }, [vehicle2Make, vehicle2Model, vehicle2Year, vehicleMake, vehicleModel, vehicleYear]);

  const hasVehicle = vehicleLines.length > 0;

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
    scheduleMode === 'customer' ||
    Boolean(scheduleDateDisplay || scheduleTimeDisplay || durationLabel);

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
  const customerRequestNotesTrimmed = useMemo(() => {
    const brief = resolveQuoteRequestBrief({
      message: customerRequestNotes,
      vehicle: vehicleLines[0] || '',
    });
    return String(brief.body ?? '').trim();
  }, [customerRequestNotes, vehicleLines]);
  const businessNoteTrimmed = String(businessNote ?? '').trim();
  const hasNotes = Boolean(customerRequestNotesTrimmed || businessNoteTrimmed);
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
        scheduleFieldsStack: {
          gap: 18,
          paddingVertical: 2,
        },
        activityIconWrap: {
          paddingTop: 2,
          width: 22,
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
        notesStack: {
          gap: 16,
          paddingTop: 2,
        },
        noteBlock: {
          gap: 4,
        },
        noteLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.2,
          textTransform: 'uppercase',
        },
        noteBody: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.15,
          lineHeight: 22,
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
        </View>
      </DetailsSectionCard>

      {showScheduleSection ? (
        <DetailsSectionCard bodyPadding="roomy" title="Schedule">
          <View style={styles.scheduleFieldsStack}>
            {scheduleMode === 'customer' ? (
              <DetailIconFieldRow
                icon="calendar-outline"
                label="Date & time"
                labelUppercase={false}
                value="Customer will choose"
              />
            ) : (
              <>
                {scheduleDateDisplay ? (
                  <DetailIconFieldRow
                    icon="calendar-outline"
                    label="Date"
                    labelUppercase={false}
                    value={scheduleDateDisplay}
                  />
                ) : null}
                {scheduleTimeDisplay ? (
                  <DetailIconFieldRow
                    icon="time-outline"
                    label="Time"
                    labelUppercase={false}
                    value={scheduleTimeDisplay}
                  />
                ) : null}
              </>
            )}
            {durationLabel ? (
              <DetailIconFieldRow
                icon="hourglass-outline"
                label="Duration"
                labelUppercase={false}
                value={durationLabel}
              />
            ) : null}
          </View>
        </DetailsSectionCard>
      ) : null}

      {showCustomerSection ? (
        <InfoSection rowGap={14} rows={customerRows} title="Customer" />
      ) : null}

      {hasVehicle ? (
        <DetailsSectionCard title={vehicleLines.length > 1 ? 'Vehicles' : 'Vehicle'}>
          <View style={{ gap: 14 }}>
            {vehicleLines.map((line) => (
              <View key={line} style={styles.vehicleRow}>
                <View style={styles.activityIconWrap}>
                  <Ionicons color={colors.accentMuted} name="car-sport" size={21} />
                </View>
                <View style={styles.vehicleTextWrap}>
                  <AppText style={styles.vehicleBody}>{line}</AppText>
                </View>
              </View>
            ))}
          </View>
        </DetailsSectionCard>
      ) : null}

      {hasNotes ? (
        <DetailsSectionCard title="Notes">
          <View style={styles.notesStack}>
            {customerRequestNotesTrimmed ? (
              <View style={styles.noteBlock}>
                <AppText style={styles.noteLabel}>Request</AppText>
                <AppText style={styles.noteBody}>{customerRequestNotesTrimmed}</AppText>
              </View>
            ) : null}
            {businessNoteTrimmed ? (
              <AppText style={styles.noteBody}>{businessNoteTrimmed}</AppText>
            ) : null}
          </View>
        </DetailsSectionCard>
      ) : null}
    </View>
  );
}
