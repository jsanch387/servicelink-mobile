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
import { formatBookingDurationMinutes } from '../utils/createFlowDuration';
import { formatAppointmentAddressSingleLine } from '../utils/formatAppointmentAddress';
import { CREATE_APPOINTMENT_LOCATION_SHOP } from '../utils/createAppointmentServiceLocation';

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
  appointmentLocationType,
  vehicle,
  notes,
  totalDurationMinutes,
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
  const optionLabel = selectedPricingOption?.label?.trim() || '';
  const priceLabelDisplay =
    selectedPricingOption?.priceLabel?.trim() || selectedService?.priceLabel?.trim() || '—';

  const fullAddress = useMemo(() => formatFullServiceAddress(address), [address]);
  const showAddressSection = appointmentLocationType !== CREATE_APPOINTMENT_LOCATION_SHOP;

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
        serviceRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 6,
        },
        serviceName: {
          color: colors.text,
          flex: 1,
          fontSize: 16,
          fontWeight: '600',
          marginRight: 12,
        },
        servicePrice: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
        },
        optionMetaLine: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 14,
        },
        serviceDivider: {
          marginBottom: 12,
        },
        addonBlockLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 11,
          letterSpacing: 0.5,
          marginBottom: 8,
          textTransform: 'uppercase',
        },
        addonRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
          paddingLeft: 2,
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
        divider: {
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
    <View style={styles.reviewRoot}>
      <DetailsSectionCard bodyPadding="roomy" title="Summary">
        <View style={styles.serviceRow}>
          <AppText numberOfLines={3} style={styles.serviceName}>
            {serviceName}
          </AppText>
          <AppText style={styles.servicePrice}>{priceLabelDisplay}</AppText>
        </View>
        {optionLabel ? (
          <AppText style={styles.optionMetaLine}>{optionLabel}</AppText>
        ) : (
          <View style={{ height: 8 }} />
        )}

        {selectedAddonRows.length > 0 ? (
          <>
            <Divider style={styles.serviceDivider} />
            <AppText style={styles.addonBlockLabel}>Add-ons</AppText>
            {selectedAddonRows.map((a) => (
              <View key={a.id} style={styles.addonRow}>
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

        <Divider style={styles.divider} />
        <View style={styles.totalRow}>
          <AppText style={styles.totalLabel}>Total</AppText>
          <AppText style={styles.totalValue}>{formatUsdFromNumber(totalUsd)}</AppText>
        </View>
      </DetailsSectionCard>

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
