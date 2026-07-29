import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import {
  AppText,
  DetailIconFieldRow,
  DetailsSectionCard,
  Divider,
  InfoSection,
} from '../../../../components/ui';
import {
  formatScheduledDateUserFacing,
  isValidCalendarYyyyMmDd,
} from '../../../quotes/utils/formatScheduledDateDisplay';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import {
  canonicalNanpDigits,
  formatPhoneForDisplay,
  isValidUsNanpTenDigits,
} from '../../../../utils/phone';
import { AddAnotherJobCard } from '../components/AddAnotherJobCard';
import { SwipeToDeleteRow } from '../components/SwipeToDeleteRow';
import { SwipeToRemoveJobTip } from '../components/SwipeToRemoveJobTip';
import { formatUsdFromNumber, parsePriceLabelToUsd } from '../utils/priceLabelMath';
import { formatBookingDurationMinutes } from '../utils/createFlowDuration';
import { formatAppointmentAddressSingleLine } from '../utils/formatAppointmentAddress';
import { CREATE_APPOINTMENT_LOCATION_SHOP } from '../utils/createAppointmentServiceLocation';
import {
  hasSeenSwipeToRemoveJobTip,
  markSwipeToRemoveJobTipSeen,
} from '../utils/swipeToRemoveJobTipStorage';

/**
 * Single-line mailing style, e.g. `14301 N IH 35, Pflugerville, TX, 78660`.
 *
 * @param {{ street?: string; unit?: string; city?: string; state?: string; zip?: string }} address
 */
function formatFullServiceAddress(address) {
  return formatAppointmentAddressSingleLine(address);
}

/**
 * @param {{
 *   jobs?: Array<{
 *     localId?: string;
 *     serviceName: string;
 *     optionLabel?: string;
 *     priceLabel: string;
 *     vehicleLine?: string;
 *     addonRows?: Array<{ id?: unknown; name?: string; priceLabel?: string; price?: string | number }>;
 *   }>;
 *   selectedService: { name?: string; durationLabel?: string; priceLabel?: string } | null;
 *   selectedPricingOption: { label: string; durationLabel: string; priceLabel: string } | null;
 *   serviceAddons: Array<{ id: string; name: string; priceLabel?: string; price?: string | number }>;
 *   selectedAddonIds: string[];
 *   selectedDateKey: string | null;
 *   selectedTime: string | null;
 *   customer: { fullName: string; email?: string; phone: string };
 *   address: { street: string; unit: string; city: string; state: string; zip: string };
 *   appointmentLocationType?: 'mobile' | 'shop' | null;
 *   vehicle: { year: string; make: string; model: string };
 *   notes: string;
 *   totalDurationMinutes: number;
 *   appliedSaleDiscount?: {
 *     lineLabel: string;
 *     discountCents: number;
 *     totalCents: number;
 *     subtotalCents: number;
 *   } | null;
 *   canAddAnotherJob?: boolean;
 *   onAddAnotherJob?: () => void;
 *   addAnotherJobDisabled?: boolean;
 *   onRemoveJob?: (localId: string) => void;
 * }} props
 */
export function ReviewStep({
  jobs: jobsProp,
  selectedService,
  selectedPricingOption,
  serviceAddons,
  selectedAddonIds,
  selectedDateKey,
  selectedTime,
  customer,
  address,
  appointmentLocationType,
  vehicle,
  notes,
  totalDurationMinutes,
  appliedSaleDiscount = null,
  canAddAnotherJob = false,
  onAddAnotherJob,
  addAnotherJobDisabled = false,
  onRemoveJob,
}) {
  const { colors } = useTheme();
  const [swipeTipVisible, setSwipeTipVisible] = useState(false);

  const fallbackAddonRows = useMemo(() => {
    const idSet = new Set((selectedAddonIds ?? []).map(String));
    return (serviceAddons ?? []).filter((a) => idSet.has(String(a.id)));
  }, [serviceAddons, selectedAddonIds]);

  const fallbackVehicleLine = useMemo(() => {
    const parts = [vehicle.year?.trim(), vehicle.make?.trim(), vehicle.model?.trim()].filter(
      Boolean,
    );
    return parts.length ? parts.join(' ') : '';
  }, [vehicle.year, vehicle.make, vehicle.model]);

  const jobs = useMemo(() => {
    if (Array.isArray(jobsProp) && jobsProp.length > 0) return jobsProp;
    return [
      {
        localId: 'current',
        serviceName: selectedService?.name?.trim() || '—',
        optionLabel: selectedPricingOption?.label?.trim() || '',
        priceLabel:
          selectedPricingOption?.priceLabel?.trim() || selectedService?.priceLabel?.trim() || '—',
        vehicleLine: fallbackVehicleLine,
        addonRows: fallbackAddonRows,
      },
    ];
  }, [
    jobsProp,
    selectedService?.name,
    selectedService?.priceLabel,
    selectedPricingOption?.label,
    selectedPricingOption?.priceLabel,
    fallbackVehicleLine,
    fallbackAddonRows,
  ]);

  const subtotalUsd = useMemo(
    () =>
      jobs.reduce((sum, job) => {
        const base = parsePriceLabelToUsd(job.priceLabel);
        const addons = (job.addonRows ?? []).reduce(
          (s, a) => s + parsePriceLabelToUsd(a.priceLabel ?? a.price),
          0,
        );
        return sum + base + addons;
      }, 0),
    [jobs],
  );

  const discountUsd = appliedSaleDiscount
    ? Math.max(0, (appliedSaleDiscount.discountCents ?? 0) / 100)
    : 0;
  const totalUsd = appliedSaleDiscount
    ? Math.max(0, (appliedSaleDiscount.totalCents ?? 0) / 100)
    : subtotalUsd;

  const fullAddress = useMemo(() => formatFullServiceAddress(address), [address]);
  const showAddressSection = appointmentLocationType !== CREATE_APPOINTMENT_LOCATION_SHOP;
  const notesTrimmed = (notes ?? '').trim();
  const multiJob = jobs.length > 1;
  const canRemoveJobs = multiJob && typeof onRemoveJob === 'function';

  useEffect(() => {
    if (!canRemoveJobs) return undefined;
    let cancelled = false;
    void (async () => {
      const seen = await hasSeenSwipeToRemoveJobTip();
      if (!cancelled && !seen) setSwipeTipVisible(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [canRemoveJobs]);

  async function dismissSwipeTip() {
    setSwipeTipVisible(false);
    await markSwipeToRemoveJobTipSeen();
  }

  function confirmRemoveJob(job, index, closeSwipe) {
    if (!onRemoveJob || !job?.localId) return;
    const name = String(job.serviceName ?? '').trim() || `Job ${index + 1}`;
    Alert.alert('Remove from visit?', `Remove ${name} from this visit?`, [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => closeSwipe?.(),
      },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => onRemoveJob(job.localId),
      },
    ]);
  }

  const scheduleDateDisplay = useMemo(() => {
    const raw = String(selectedDateKey ?? '').trim();
    if (!isValidCalendarYyyyMmDd(raw)) return null;
    return formatScheduledDateUserFacing(raw) || null;
  }, [selectedDateKey]);

  const scheduleTimeDisplay = useMemo(() => {
    const t = String(selectedTime ?? '').trim();
    return t.length > 0 ? t : null;
  }, [selectedTime]);

  const durationDisplay = formatBookingDurationMinutes(totalDurationMinutes);

  const showScheduleSection = Boolean(
    scheduleDateDisplay || scheduleTimeDisplay || durationDisplay,
  );

  const phoneDigits10 = useMemo(() => {
    const d = canonicalNanpDigits(customer.phone);
    return isValidUsNanpTenDigits(d) ? d : null;
  }, [customer.phone]);

  const phoneLine = useMemo(
    () => (phoneDigits10 ? formatPhoneForDisplay(phoneDigits10) : null),
    [phoneDigits10],
  );

  const customerRows = useMemo(() => {
    const rows = [];
    const name = String(customer.fullName ?? '').trim();
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
    const email = String(customer.email ?? '').trim();
    if (email) {
      rows.push({ key: 'email', icon: 'mail-outline', value: email });
    }
    return rows;
  }, [customer.email, customer.fullName, phoneDigits10, phoneLine]);

  const showCustomerSection = customerRows.length > 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        reviewRoot: {
          gap: 22,
        },
        section: {
          rowGap: 8,
        },
        sectionTitle: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        jobsStack: {
          gap: 10,
        },
        jobTopRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        jobMainCol: {
          flex: 1,
          marginRight: 12,
          minWidth: 0,
        },
        jobPriceCol: {
          alignItems: 'flex-end',
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
        vehicleMetaTextSolo: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          marginTop: 10,
        },
        serviceDivider: {
          marginBottom: 10,
          marginTop: 12,
        },
        addonRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
          paddingLeft: 2,
        },
        addonRowLast: {
          marginBottom: 0,
        },
        addonName: {
          color: colors.text,
          flex: 1,
          fontSize: 14,
          fontWeight: '500',
          marginRight: 12,
        },
        addonPrice: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '600',
        },
        discountRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 10,
        },
        discountLabel: {
          color: colors.textSuccess ?? colors.text,
          flex: 1,
          fontSize: 13,
          fontWeight: '500',
          marginRight: 12,
        },
        discountValue: {
          color: colors.textSuccess ?? colors.text,
          fontSize: 13,
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
        totalRow: {
          alignItems: 'baseline',
          flexDirection: 'row',
          justifyContent: 'space-between',
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
        addressRow: {
          flexDirection: 'row',
          gap: 14,
          paddingTop: 2,
        },
        addressTextWrap: {
          flex: 1,
          paddingTop: 1,
        },
        addressBody: {
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
        jobCard: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          paddingHorizontal: 12,
          paddingVertical: 12,
        },
        notesStack: {
          gap: 0,
          paddingVertical: 2,
        },
        noteReadonlyBody: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 22,
        },
      }),
    [colors],
  );

  return (
    <>
      <View style={styles.reviewRoot}>
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Summary</AppText>
          <View style={styles.jobsStack}>
            {jobs.map((job, index) => {
              const addonRows = job.addonRows ?? [];
              const optionLabel = String(job.optionLabel ?? '').trim();
              const vehicleLine = String(job.vehicleLine ?? '').trim();
              const jobKey = `${job.localId ?? 'job'}-${index}`;
              return (
                <SwipeToDeleteRow
                  key={jobKey}
                  accessibilityLabel={`Remove ${job.serviceName || 'job'}`}
                  enabled={Boolean(canRemoveJobs && job.localId)}
                  onDeletePress={({ close }) => confirmRemoveJob(job, index, close)}
                >
                  <View style={styles.jobCard}>
                    <View style={styles.jobTopRow}>
                      <View style={styles.jobMainCol}>
                        <AppText numberOfLines={3} style={styles.serviceName}>
                          {job.serviceName || '—'}
                        </AppText>
                        {optionLabel ? (
                          <AppText style={styles.optionMetaLine}>{optionLabel}</AppText>
                        ) : null}
                        {vehicleLine ? (
                          <AppText numberOfLines={1} style={styles.vehicleMetaTextSolo}>
                            {vehicleLine}
                          </AppText>
                        ) : null}
                      </View>
                      <View style={styles.jobPriceCol}>
                        <AppText style={styles.servicePrice}>{job.priceLabel || '—'}</AppText>
                      </View>
                    </View>
                    {addonRows.length > 0 ? (
                      <>
                        <Divider style={styles.serviceDivider} />
                        {addonRows.map((a, addonIndex) => (
                          <View
                            key={String(a.id ?? `${index}-${addonIndex}`)}
                            style={[
                              styles.addonRow,
                              addonIndex === addonRows.length - 1 ? styles.addonRowLast : null,
                            ]}
                          >
                            <AppText numberOfLines={2} style={styles.addonName}>
                              {a.name}
                            </AppText>
                            <AppText style={styles.addonPrice}>
                              {formatUsdFromNumber(parsePriceLabelToUsd(a.priceLabel ?? a.price))}
                            </AppText>
                          </View>
                        ))}
                      </>
                    ) : null}
                  </View>
                </SwipeToDeleteRow>
              );
            })}

            <View style={styles.totalCard}>
              {appliedSaleDiscount && discountUsd > 0 ? (
                <View style={styles.discountRow}>
                  <AppText numberOfLines={2} style={styles.discountLabel}>
                    {appliedSaleDiscount.lineLabel}
                  </AppText>
                  <AppText style={styles.discountValue}>
                    −{formatUsdFromNumber(discountUsd)}
                  </AppText>
                </View>
              ) : null}
              <View style={styles.totalRow}>
                <AppText style={styles.totalLabel}>{multiJob ? 'Visit total' : 'Total'}</AppText>
                <AppText style={styles.totalValue}>{formatUsdFromNumber(totalUsd)}</AppText>
              </View>
            </View>
          </View>
        </View>

        {showScheduleSection ? (
          <DetailsSectionCard bodyPadding="roomy" title="Schedule">
            <View style={styles.scheduleFieldsStack}>
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
              <DetailIconFieldRow
                icon="hourglass-outline"
                label="Duration"
                labelUppercase={false}
                value={durationDisplay}
              />
            </View>
          </DetailsSectionCard>
        ) : null}

        {showCustomerSection ? (
          <InfoSection bodyPadding="roomy" rowGap={14} rows={customerRows} title="Customer" />
        ) : null}

        {showAddressSection ? (
          <DetailsSectionCard bodyPadding="roomy" title="Service address">
            <View style={styles.addressRow}>
              <View style={styles.activityIconWrap}>
                <Ionicons color={colors.accentMuted} name="location-outline" size={21} />
              </View>
              <View style={styles.addressTextWrap}>
                <AppText style={styles.addressBody}>{fullAddress}</AppText>
              </View>
            </View>
          </DetailsSectionCard>
        ) : null}

        {!multiJob && fallbackVehicleLine ? (
          <DetailsSectionCard bodyPadding="roomy" title="Vehicle">
            <View style={styles.vehicleRow}>
              <View style={styles.activityIconWrap}>
                <Ionicons color={colors.accentMuted} name="car-sport" size={21} />
              </View>
              <View style={styles.vehicleTextWrap}>
                <AppText style={styles.vehicleBody}>{fallbackVehicleLine}</AppText>
              </View>
            </View>
          </DetailsSectionCard>
        ) : null}

        <DetailsSectionCard bodyPadding="roomy" title="Notes">
          <View style={styles.notesStack}>
            <AppText
              style={[
                styles.noteReadonlyBody,
                !notesTrimmed && { color: colors.textMuted, fontStyle: 'italic' },
              ]}
            >
              {notesTrimmed || 'None'}
            </AppText>
          </View>
        </DetailsSectionCard>

        {canAddAnotherJob && onAddAnotherJob ? (
          <AddAnotherJobCard disabled={addAnotherJobDisabled} onPress={onAddAnotherJob} />
        ) : null}
      </View>
      <SwipeToRemoveJobTip visible={swipeTipVisible} onDismiss={dismissSwipeTip} />
    </>
  );
}
