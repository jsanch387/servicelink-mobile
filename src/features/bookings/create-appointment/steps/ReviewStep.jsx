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
 * @param {{
 *   selectedService: { name?: string } | null;
 *   selectedPricingOption: { label: string; durationLabel: string; priceLabel: string } | null;
 *   serviceAddons: Array<{ id: string; name: string }>;
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

  const addonSummary = useMemo(() => {
    const idSet = new Set((selectedAddonIds ?? []).map(String));
    const names = (serviceAddons ?? []).filter((a) => idSet.has(String(a.id))).map((a) => a.name);
    return names.length ? names.join(', ') : 'None';
  }, [serviceAddons, selectedAddonIds]);

  const streetLine = useMemo(() => {
    const parts = [address.street?.trim(), address.unit?.trim()].filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
  }, [address.street, address.unit]);

  const cityLine = useMemo(() => {
    const city = address.city?.trim();
    const state = address.state?.trim();
    const zip = address.zip?.trim();
    const mid = [city, state].filter(Boolean).join(', ');
    const tail = [mid, zip].filter(Boolean).join(' ');
    return tail || '—';
  }, [address.city, address.state, address.zip]);

  const vehicleLine = useMemo(() => {
    const parts = [vehicle.year?.trim(), vehicle.make?.trim(), vehicle.model?.trim()].filter(
      Boolean,
    );
    return parts.length ? parts.join(' ') : '—';
  }, [vehicle.year, vehicle.make, vehicle.model]);

  const pricingLine = useMemo(() => {
    if (!selectedPricingOption) return '—';
    const { label, durationLabel, priceLabel } = selectedPricingOption;
    return `${label} — ${durationLabel} — ${priceLabel}`;
  }, [selectedPricingOption]);

  const notesTrimmed = (notes ?? '').trim();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          gap: 18,
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
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <DetailsSectionCard title="Service & pricing">
        <LabelValueRow label="Service" noTopMargin value={selectedService?.name?.trim() || '—'} />
        <LabelValueRow label="Tier" value={pricingLine} />
        <LabelValueRow label="Add-ons" value={addonSummary} />
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
        <LabelValueRow label="Street" noTopMargin value={streetLine} />
        <LabelValueRow label="City & ZIP" value={cityLine} />
      </DetailsSectionCard>

      <DetailsSectionCard title="Vehicle">
        <LabelValueRow label="Vehicle" noTopMargin value={vehicleLine} />
      </DetailsSectionCard>

      <DetailsSectionCard title="Appointment notes">
        <AppText style={notesTrimmed ? styles.notesBody : styles.notesEmpty}>
          {notesTrimmed || 'None'}
        </AppText>
      </DetailsSectionCard>
    </View>
  );
}
