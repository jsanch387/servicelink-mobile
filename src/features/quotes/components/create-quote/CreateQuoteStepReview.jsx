import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import {
  AppText,
  DetailIconFieldRow,
  DetailsSectionCard,
  Divider,
  InfoSection,
  SurfaceCard,
} from '../../../../components/ui';
import {
  formatServiceDurationSelectLabel,
  isValidServiceDurationHHmm,
} from '../../../../components/ui/durationTime';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { parsePriceLabelToUsd } from '../../../bookings/create-appointment/utils/priceLabelMath';
import { canonicalNanpDigits, formatPhoneWithCountryCode } from '../../../../utils/phone';
import { splitBookingServiceName } from '../../../../utils/splitBookingServiceName';
import {
  formatScheduledDateUserFacing,
  isValidCalendarYyyyMmDd,
} from '../../utils/formatScheduledDateDisplay';
import { resolveQuoteRequestBrief } from '../../utils/resolveQuoteRequestBrief';
import { quotePaymentReviewTiles } from '../../utils/quotePaymentOptions';
import { formatQuoteMoney } from '../../utils/quotePresentation';
import { buildQuoteTaxPreview, quotePriceTextToCents } from '../../utils/quoteTaxPreview';

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
 * @param {string[]} [props.paymentMethods]
 * @param {string | null} [props.paymentDepositLabel]
 * @param {boolean} [props.taxEnabled]
 * @param {number | null} [props.taxRateBps]
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
  paymentMethods = [],
  paymentDepositLabel = null,
  taxEnabled = false,
  taxRateBps = null,
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

  const taxPreview = useMemo(
    () =>
      buildQuoteTaxPreview({
        priceCents: quotePriceTextToCents(priceUsdText),
        taxEnabled,
        taxRateBps,
      }),
    [priceUsdText, taxEnabled, taxRateBps],
  );
  const showTax = taxPreview.taxCents > 0;
  const hasQuotePrice = priceDisplay != null;
  const customerTotalDisplay = hasQuotePrice
    ? formatQuoteMoney(taxPreview.customerPaysCents)
    : null;

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
  const addonCents = reviewAddons.reduce(
    (sum, addon) => sum + Math.round(parsePriceLabelToUsd(addon.priceLabel ?? addon.price) * 100),
    0,
  );
  const serviceCents = Math.max(0, taxPreview.priceCents - addonCents);
  const servicePriceLabel = hasQuotePrice ? formatQuoteMoney(serviceCents) : '—';
  const jobPriceLabel = hasQuotePrice ? formatQuoteMoney(taxPreview.priceCents) : '—';
  const paymentTiles = quotePaymentReviewTiles(paymentMethods, {
    depositLabel: paymentDepositLabel,
    totalLabel: customerTotalDisplay,
  });
  const showPayment = paymentTiles.length > 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        reviewRoot: {
          gap: 16,
        },
        reviewHeader: {
          gap: 12,
        },
        reviewTitle: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 28,
          letterSpacing: -0.6,
          lineHeight: 34,
        },
        paymentSection: {
          gap: 8,
        },
        paymentSectionTitle: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        paymentRow: {
          alignItems: 'stretch',
          flexDirection: 'row',
          gap: 8,
          width: '100%',
        },
        paymentTileCol: {
          flexBasis: 0,
          flexGrow: 1,
          flexShrink: 1,
          minWidth: 0,
        },
        paymentTile: {
          gap: 8,
          width: '100%',
        },
        paymentTileMulti: {
          alignItems: 'center',
          height: 68,
          justifyContent: 'center',
          paddingHorizontal: 6,
        },
        paymentTileSingle: {
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        paymentTileTitle: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 12,
          fontWeight: '500',
          lineHeight: 16,
          textAlign: 'center',
        },
        paymentTileTitlePair: {
          fontSize: 14,
          lineHeight: 18,
        },
        paymentTileTitleSingle: {
          fontSize: 13,
          lineHeight: 18,
          textAlign: 'left',
        },
        paymentTileDetail: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          lineHeight: 17,
          textAlign: 'center',
        },
        paymentTileDetailPair: {
          fontSize: 16,
          lineHeight: 20,
        },
        paymentTileDetailSingle: {
          fontSize: 16,
          lineHeight: 22,
          textAlign: 'left',
        },
        proposalSection: {
          rowGap: 8,
        },
        proposalTitle: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        proposalStack: {
          gap: 10,
        },
        jobCard: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          paddingHorizontal: 12,
          paddingVertical: 12,
        },
        jobTopRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
        },
        jobMainCol: {
          flex: 1,
          marginRight: 12,
          minWidth: 0,
        },
        jobPriceCol: {
          alignItems: 'flex-end',
          flexShrink: 0,
        },
        serviceName: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.3,
        },
        servicePrice: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.3,
        },
        optionMetaLine: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
        },
        serviceDivider: {
          marginBottom: 10,
          marginTop: 12,
        },
        addonRow: {
          alignItems: 'center',
          flexDirection: 'row',
          marginBottom: 8,
          paddingLeft: 2,
          width: '100%',
        },
        addonRowLast: {
          marginBottom: 0,
        },
        addonNameCol: {
          flex: 1,
          justifyContent: 'center',
          marginRight: 12,
          minWidth: 0,
        },
        addonPriceCol: {
          alignItems: 'flex-end',
          flexShrink: 0,
          justifyContent: 'center',
        },
        addonName: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '500',
        },
        addonPrice: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '600',
        },
        totalCard: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          paddingHorizontal: 12,
          paddingVertical: 14,
        },
        breakdownRow: {
          alignItems: 'center',
          flexDirection: 'row',
          marginBottom: 10,
          width: '100%',
        },
        breakdownLabelCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
          paddingRight: 12,
        },
        breakdownValueCol: {
          alignItems: 'flex-end',
          flexShrink: 0,
          justifyContent: 'center',
        },
        breakdownLabel: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '500',
        },
        breakdownValue: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '600',
        },
        totalRow: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        totalLabelCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        totalValueCol: {
          alignItems: 'flex-end',
          flexShrink: 0,
          justifyContent: 'center',
          marginLeft: 12,
        },
        totalLabel: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '700',
        },
        totalValue: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.2,
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
      <View style={styles.reviewHeader}>
        <AppText accessibilityRole="header" style={styles.reviewTitle}>
          Review
        </AppText>
        <Divider />
      </View>

      <View style={styles.proposalSection}>
        <AppText style={styles.proposalTitle}>Proposal</AppText>
        <View style={styles.proposalStack}>
          <View style={styles.jobCard}>
            <View style={styles.jobTopRow}>
              <View style={styles.jobMainCol}>
                <AppText numberOfLines={3} style={styles.serviceName}>
                  {serviceHeadline}
                </AppText>
                {optionLine ? <AppText style={styles.optionMetaLine}>{optionLine}</AppText> : null}
              </View>
              <View style={styles.jobPriceCol}>
                <AppText style={styles.servicePrice}>{servicePriceLabel}</AppText>
              </View>
            </View>
            {hasAddons ? (
              <>
                <Divider style={styles.serviceDivider} />
                {reviewAddons.map((addon, addonIndex) => (
                  <View
                    key={addon.id}
                    style={[
                      styles.addonRow,
                      addonIndex === reviewAddons.length - 1 ? styles.addonRowLast : null,
                    ]}
                  >
                    <View style={styles.addonNameCol}>
                      <AppText numberOfLines={2} style={styles.addonName}>
                        {addon.name}
                      </AppText>
                    </View>
                    <View style={styles.addonPriceCol}>
                      <AppText style={styles.addonPrice}>
                        {formatQuoteMoney(
                          Math.round(parsePriceLabelToUsd(addon.priceLabel ?? addon.price) * 100),
                        )}
                      </AppText>
                    </View>
                  </View>
                ))}
              </>
            ) : null}
          </View>

          <View style={styles.totalCard}>
            {showTax ? (
              <>
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownLabelCol}>
                    <AppText numberOfLines={1} style={styles.breakdownLabel}>
                      Job price
                    </AppText>
                  </View>
                  <View style={styles.breakdownValueCol}>
                    <AppText style={styles.breakdownValue}>{jobPriceLabel}</AppText>
                  </View>
                </View>
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownLabelCol}>
                    <AppText numberOfLines={1} style={styles.breakdownLabel}>
                      {taxPreview.label}
                    </AppText>
                  </View>
                  <View style={styles.breakdownValueCol}>
                    <AppText style={styles.breakdownValue}>
                      {formatQuoteMoney(taxPreview.taxCents)}
                    </AppText>
                  </View>
                </View>
              </>
            ) : null}
            <View style={styles.totalRow}>
              <View style={styles.totalLabelCol}>
                <AppText style={styles.totalLabel}>Total</AppText>
              </View>
              <View style={styles.totalValueCol}>
                <AppText style={styles.totalValue}>{customerTotalDisplay || '—'}</AppText>
              </View>
            </View>
          </View>
        </View>
      </View>

      {showPayment ? (
        <View style={styles.paymentSection}>
          <AppText style={styles.paymentSectionTitle}>Payment options</AppText>
          <View style={styles.paymentRow}>
            {paymentTiles.map((tile) => {
              const single = paymentTiles.length === 1;
              const pair = paymentTiles.length === 2;
              const compact = paymentTiles.length > 2;
              let title = tile.title;
              let detail = tile.detail;
              if (compact && tile.id === 'pay_in_full') title = 'In full';
              return (
                <View key={tile.id} style={styles.paymentTileCol}>
                  <SurfaceCard
                    outlined
                    padding="none"
                    style={[
                      styles.paymentTile,
                      single ? styles.paymentTileSingle : styles.paymentTileMulti,
                    ]}
                  >
                    <AppText
                      adjustsFontSizeToFit={!single}
                      minimumFontScale={0.8}
                      numberOfLines={1}
                      style={[
                        styles.paymentTileTitle,
                        pair && styles.paymentTileTitlePair,
                        single && styles.paymentTileTitleSingle,
                      ]}
                    >
                      {title}
                    </AppText>
                    {detail ? (
                      <AppText
                        adjustsFontSizeToFit={!single}
                        minimumFontScale={0.75}
                        numberOfLines={1}
                        style={[
                          styles.paymentTileDetail,
                          pair && styles.paymentTileDetailPair,
                          single && styles.paymentTileDetailSingle,
                        ]}
                      >
                        {detail}
                      </AppText>
                    ) : null}
                  </SurfaceCard>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

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
