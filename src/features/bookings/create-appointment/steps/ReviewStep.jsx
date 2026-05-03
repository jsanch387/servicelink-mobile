import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  DetailsSectionCard,
  LabelValueRow,
  parseLocalYyyyMmDd,
} from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { formatPhoneForDisplay } from '../../../../utils/phone';
import { formatUsdFromNumber, parsePriceLabelToUsd } from '../utils/priceLabelMath';

function formatReviewDate(dateKey) {
  const d = parseLocalYyyyMmDd(dateKey);
  if (!d) return '—';
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

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

function ReviewField({ styles, label, value, emphasize = false, noTopMargin = false }) {
  return (
    <View style={[styles.reviewFieldRow, noTopMargin && styles.reviewFieldRowFirst]}>
      <AppText style={styles.reviewFieldLabel}>{label}</AppText>
      <AppText style={[styles.reviewFieldValue, emphasize && styles.reviewFieldValueEmphasized]}>
        {value}
      </AppText>
    </View>
  );
}

/**
 * @param {{
 *   selectedService: { name?: string; durationLabel?: string; priceLabel?: string } | null;
 *   selectedPricingOption: { label: string; durationLabel: string; priceLabel: string } | null;
 *   serviceAddons: Array<{ id: string; name: string; priceLabel?: string; price?: string | number }>;
 *   selectedAddonIds: string[];
 *   selectedDateKey: string | null;
 *   selectedTime: string | null;
 *   customer: { fullName: string; email: string; phone: string };
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
  const priceValue =
    selectedPricingOption?.priceLabel?.trim() || selectedService?.priceLabel?.trim() || '—';

  const fullAddress = useMemo(() => formatFullServiceAddress(address), [address]);

  const vehicleLine = useMemo(() => {
    const parts = [vehicle.year?.trim(), vehicle.make?.trim(), vehicle.model?.trim()].filter(
      Boolean,
    );
    return parts.length ? parts.join(' ') : '—';
  }, [vehicle.year, vehicle.make, vehicle.model]);

  const notesTrimmed = (notes ?? '').trim();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          gap: 18,
        },
        reviewFieldRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'space-between',
          marginTop: 10,
        },
        reviewFieldRowFirst: {
          marginTop: 0,
        },
        reviewFieldLabel: {
          color: colors.textMuted,
          flexShrink: 0,
          fontSize: 14,
          lineHeight: 20,
          maxWidth: '42%',
        },
        reviewFieldValue: {
          color: colors.text,
          flex: 1,
          flexGrow: 1,
          fontSize: 15,
          fontWeight: '400',
          lineHeight: 21,
          minWidth: 0,
          textAlign: 'right',
        },
        reviewFieldValueEmphasized: {
          fontSize: 17,
          fontWeight: '700',
          lineHeight: 22,
        },
        notesBody: {
          color: colors.text,
          fontSize: 15,
          lineHeight: 22,
        },
        notesEmpty: {
          color: colors.textMuted,
          fontSize: 15,
          fontStyle: 'italic',
          lineHeight: 22,
        },
        addressBody: {
          color: colors.text,
          fontSize: 15,
          lineHeight: 22,
        },
        addonBlock: {
          marginTop: 10,
        },
        addonHeadingRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'space-between',
        },
        addonHeadingLabel: {
          color: colors.textMuted,
          flexShrink: 0,
          fontSize: 14,
          lineHeight: 20,
          maxWidth: '42%',
        },
        addonHeadingValue: {
          color: colors.text,
          flex: 1,
          fontSize: 15,
          lineHeight: 21,
          minWidth: 0,
          textAlign: 'right',
        },
        addonSectionTitle: {
          color: colors.textMuted,
          fontSize: 14,
          lineHeight: 20,
          marginBottom: 6,
        },
        addonLineRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 10,
          justifyContent: 'space-between',
          marginTop: 8,
          paddingLeft: 2,
        },
        addonLineRowFirst: {
          marginTop: 0,
        },
        addonLineName: {
          color: colors.text,
          flex: 1,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 19,
          minWidth: 0,
        },
        addonLinePrice: {
          color: colors.text,
          flexShrink: 0,
          fontSize: 14,
          fontWeight: '600',
          lineHeight: 19,
        },
        totalDivider: {
          backgroundColor: colors.borderStrong,
          borderRadius: 999,
          height: 1,
          marginTop: 14,
          opacity: 0.85,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <DetailsSectionCard title="Service & pricing">
        <ReviewField label="Service" noTopMargin styles={styles} value={serviceName} />
        <ReviewField label="Option" styles={styles} value={optionLabel} />
        <ReviewField label="Duration" styles={styles} value={durationValue} />
        <ReviewField label="Price" styles={styles} value={priceValue} />

        <View style={styles.addonBlock}>
          {selectedAddonRows.length === 0 ? (
            <View style={styles.addonHeadingRow}>
              <AppText style={styles.addonHeadingLabel}>Add-ons</AppText>
              <AppText style={styles.addonHeadingValue}>None</AppText>
            </View>
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

        <View style={styles.totalDivider} />
        <ReviewField
          emphasize
          label="Total"
          styles={styles}
          value={formatUsdFromNumber(totalUsd)}
        />
      </DetailsSectionCard>

      <DetailsSectionCard title="Schedule">
        <LabelValueRow label="Date" noTopMargin value={formatReviewDate(selectedDateKey)} />
        <LabelValueRow label="Time" value={selectedTime?.trim() || '—'} />
      </DetailsSectionCard>

      <DetailsSectionCard title="Customer">
        <LabelValueRow label="Name" noTopMargin value={customer.fullName?.trim() || '—'} />
        <LabelValueRow label="Email" value={customer.email?.trim() || '—'} />
        <LabelValueRow label="Phone" value={formatPhoneForDisplay(customer.phone) || '—'} />
      </DetailsSectionCard>

      <DetailsSectionCard title="Service address">
        <AppText style={styles.addressBody}>{fullAddress}</AppText>
      </DetailsSectionCard>

      <DetailsSectionCard title="Vehicle">
        <LabelValueRow label="Vehicle" noTopMargin value={vehicleLine} />
      </DetailsSectionCard>

      <DetailsSectionCard title="Notes">
        <AppText style={notesTrimmed ? styles.notesBody : styles.notesEmpty}>
          {notesTrimmed || 'None'}
        </AppText>
      </DetailsSectionCard>
    </View>
  );
}
