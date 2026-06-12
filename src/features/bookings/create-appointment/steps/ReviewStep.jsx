import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import {
  AppText,
  DetailsSectionCard,
  Divider,
  InfoSection,
  LabelValueRow,
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
import { formatUsdFromNumber, parsePriceLabelToUsd } from '../utils/priceLabelMath';

/**
 * Single-line mailing style, e.g. `14301 N IH 35, Pflugerville, TX, 78660`.
 *
 * @param {{ street?: string; unit?: string; city?: string; state?: string; zip?: string }} address
 */
function formatFullServiceAddress(address) {
  const parts = [
    address.street?.trim(),
    address.unit?.trim(),
    address.city?.trim(),
    address.state?.trim(),
    address.zip?.trim(),
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

/**
 * @param {{
 *   selectedService: { name?: string; durationLabel?: string; priceLabel?: string } | null;
 *   selectedPricingOption: { label: string; durationLabel: string; priceLabel: string } | null;
 *   serviceAddons: Array<{ id: string; name: string; priceLabel?: string; price?: string | number }>;
 *   selectedAddonIds: string[];
 *   selectedDateKey: string | null;
 *   selectedTime: string | null;
 *   customer: { fullName: string; email?: string; phone: string };
 *   address: { street: string; unit: string; city: string; state: string; zip: string };
 *   vehicle: { year: string; make: string; model: string };
 *   notes: string;
 * }} props
 */
export function ReviewStep({
  selectedService,
  selectedPricingOption,
  serviceAddons,
  selectedAddonIds,
  selectedDateKey,
  selectedTime,
  customer,
  address,
  vehicle,
  notes,
}) {
  const { colors } = useTheme();

  const selectedAddonRows = useMemo(() => {
    const idSet = new Set((selectedAddonIds ?? []).map(String));
    return (serviceAddons ?? []).filter((a) => idSet.has(String(a.id)));
  }, [serviceAddons, selectedAddonIds]);

  const baseUsd = useMemo(() => {
    const label = selectedPricingOption?.priceLabel ?? selectedService?.priceLabel ?? '';
    return parsePriceLabelToUsd(label);
  }, [selectedPricingOption?.priceLabel, selectedService?.priceLabel]);

  const addonsUsdSum = useMemo(
    () => selectedAddonRows.reduce((s, a) => s + parsePriceLabelToUsd(a.priceLabel ?? a.price), 0),
    [selectedAddonRows],
  );

  const totalUsd = baseUsd + addonsUsdSum;

  const serviceName = selectedService?.name?.trim() || '—';
  const optionLabel = selectedPricingOption?.label?.trim() || '—';
  const durationValue =
    selectedPricingOption?.durationLabel?.trim() || selectedService?.durationLabel?.trim() || '—';
  const priceLabelDisplay =
    selectedPricingOption?.priceLabel?.trim() || selectedService?.priceLabel?.trim() || '—';

  const fullAddress = useMemo(() => formatFullServiceAddress(address), [address]);

  const vehicleLine = useMemo(() => {
    const parts = [vehicle.year?.trim(), vehicle.make?.trim(), vehicle.model?.trim()].filter(
      Boolean,
    );
    return parts.length ? parts.join(' ') : '';
  }, [vehicle.year, vehicle.make, vehicle.model]);

  const hasVehicle = vehicleLine.length > 0;

  const notesTrimmed = (notes ?? '').trim();

  const scheduleDateDisplay = useMemo(() => {
    const raw = String(selectedDateKey ?? '').trim();
    if (!isValidCalendarYyyyMmDd(raw)) return null;
    return formatScheduledDateUserFacing(raw) || null;
  }, [selectedDateKey]);

  const scheduleTimeDisplay = useMemo(() => {
    const t = String(selectedTime ?? '').trim();
    return t.length > 0 ? t : null;
  }, [selectedTime]);

  const showScheduleSection = Boolean(scheduleDateDisplay || scheduleTimeDisplay);

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
        heroSub: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 21,
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
        breakdownBlock: {
          marginTop: 18,
        },
        addonBlock: {
          marginTop: 16,
        },
        totalDividerWrap: {
          marginBottom: 12,
          marginTop: 18,
        },
        totalRow: {
          alignItems: 'baseline',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        totalLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.2,
          textTransform: 'uppercase',
        },
        totalValue: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 28,
          letterSpacing: -0.55,
          lineHeight: 34,
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
        scheduleIconWrap: {
          paddingTop: 2,
          width: 22,
        },
        scheduleActivityLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.1,
          marginBottom: 4,
        },
        scheduleActivityValue: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.15,
          lineHeight: 22,
        },
        scheduleTextCol: {
          flex: 1,
          minWidth: 0,
        },
        addonSectionTitle: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginBottom: 10,
          textTransform: 'uppercase',
        },
        addonLineRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 10,
          justifyContent: 'space-between',
          marginTop: 8,
        },
        addonLineRowFirst: {
          marginTop: 0,
        },
        addonLineName: {
          color: colors.textSecondary,
          flex: 1,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.15,
          lineHeight: 22,
          minWidth: 0,
        },
        addonLinePrice: {
          color: colors.text,
          flexShrink: 0,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
          fontWeight: '600',
          lineHeight: 20,
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

  const serviceHeadline = serviceName.trim() || 'Service';

  return (
    <View style={styles.reviewRoot}>
      <AppText style={styles.heroSub}>
        Confirm the details below, then create the appointment.
      </AppText>

      <DetailsSectionCard bodyPadding="roomy" title="Proposal">
        <View style={styles.proposalInner}>
          <AppText style={styles.serviceTitle}>{serviceHeadline}</AppText>

          <View style={styles.breakdownBlock}>
            <LabelValueRow
              label="Option"
              labelAppearance="caption"
              noTopMargin
              value={optionLabel}
            />
            <LabelValueRow label="Duration" labelAppearance="caption" value={durationValue} />
            <LabelValueRow
              label="Service price"
              labelAppearance="caption"
              value={priceLabelDisplay}
            />
          </View>

          <View style={styles.addonBlock}>
            {selectedAddonRows.length === 0 ? (
              <LabelValueRow label="Add-ons" labelAppearance="caption" noTopMargin value="None" />
            ) : (
              <>
                <AppText style={styles.addonSectionTitle}>Add-ons</AppText>
                {selectedAddonRows.map((a, index) => {
                  const addonPrice = formatUsdFromNumber(
                    parsePriceLabelToUsd(a.priceLabel ?? a.price),
                  );
                  return (
                    <View
                      key={a.id}
                      style={[styles.addonLineRow, index === 0 && styles.addonLineRowFirst]}
                    >
                      <AppText ellipsizeMode="tail" numberOfLines={3} style={styles.addonLineName}>
                        {a.name}
                      </AppText>
                      <AppText style={styles.addonLinePrice}>{addonPrice}</AppText>
                    </View>
                  );
                })}
              </>
            )}
          </View>

          <View style={styles.totalDividerWrap}>
            <Divider />
          </View>
          <View style={styles.totalRow}>
            <AppText style={styles.totalLabel}>Total</AppText>
            <AppText style={styles.totalValue}>{formatUsdFromNumber(totalUsd)}</AppText>
          </View>
        </View>
      </DetailsSectionCard>

      {showScheduleSection ? (
        <DetailsSectionCard bodyPadding="roomy" title="Schedule">
          <View style={styles.activityStack}>
            {scheduleDateDisplay ? (
              <View style={styles.activityRow}>
                <View style={styles.scheduleIconWrap}>
                  <Ionicons color={colors.text} name="calendar-outline" size={19} />
                </View>
                <View style={styles.scheduleTextCol}>
                  <AppText style={styles.scheduleActivityLabel}>Date</AppText>
                  <AppText style={styles.scheduleActivityValue}>{scheduleDateDisplay}</AppText>
                </View>
              </View>
            ) : null}
            {scheduleTimeDisplay ? (
              <View style={styles.activityRow}>
                <View style={styles.scheduleIconWrap}>
                  <Ionicons color={colors.text} name="time-outline" size={19} />
                </View>
                <View style={styles.scheduleTextCol}>
                  <AppText style={styles.scheduleActivityLabel}>Time</AppText>
                  <AppText style={styles.scheduleActivityValue}>{scheduleTimeDisplay}</AppText>
                </View>
              </View>
            ) : null}
          </View>
        </DetailsSectionCard>
      ) : null}

      {showCustomerSection ? (
        <InfoSection bodyPadding="roomy" rowGap={14} rows={customerRows} title="Customer" />
      ) : null}

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

      {hasVehicle ? (
        <DetailsSectionCard bodyPadding="roomy" title="Vehicle">
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
    </View>
  );
}
