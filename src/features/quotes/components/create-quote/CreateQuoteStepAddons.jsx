import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard, Divider } from '../../../../components/ui';
import { ChoiceRow } from '../../../bookings/create-appointment/components/ChoiceRow';
import {
  formatUsdFromNumber,
  parsePriceLabelToUsd,
} from '../../../bookings/create-appointment/utils/priceLabelMath';
import { FONT_FAMILIES, useTheme } from '../../../../theme';

/**
 * Optional add-ons for a catalog quote (mirrors create-appointment AddonsStep).
 *
 * @param {{
 *   service: { name: string; priceLabel?: string } | null;
 *   selectedPricingOption?: { label: string; priceLabel: string } | null;
 *   serviceAddons?: Array<{ id: string; name: string; priceLabel?: string; price?: string }> | null;
 *   selectedAddonIds: string[];
 *   onToggleAddon: (id: string) => void;
 * }} props
 */
export function CreateQuoteStepAddons({
  service,
  selectedPricingOption,
  serviceAddons,
  selectedAddonIds,
  onToggleAddon,
}) {
  const { colors } = useTheme();

  const baseUsd = useMemo(
    () => parsePriceLabelToUsd(selectedPricingOption?.priceLabel ?? service?.priceLabel),
    [selectedPricingOption?.priceLabel, service?.priceLabel],
  );

  const headerOptionPrice =
    selectedPricingOption?.priceLabel ?? service?.priceLabel ?? formatUsdFromNumber(0);

  const selectedAddonRows = useMemo(() => {
    const list = serviceAddons ?? [];
    const idSet = new Set((selectedAddonIds ?? []).map(String));
    return list.filter((a) => idSet.has(String(a.id)));
  }, [serviceAddons, selectedAddonIds]);

  const addonsUsdSum = selectedAddonRows.reduce(
    (s, a) => s + parsePriceLabelToUsd(a.priceLabel ?? a.price),
    0,
  );
  const totalUsd = baseUsd + addonsUsdSum;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        summarySection: {
          marginTop: 20,
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
        optionSummaryLine: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          marginBottom: 12,
        },
        serviceDivider: {
          marginBottom: 12,
        },
        addonBlock: {
          marginTop: 0,
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
        empty: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
        },
      }),
    [colors],
  );

  if (!service) {
    return <AppText style={styles.empty}>Select a service first.</AppText>;
  }

  const addons = serviceAddons ?? [];

  return (
    <View>
      {addons.map((addon) => {
        const selected = selectedAddonIds.some((id) => String(id) === String(addon.id));
        const priceLine = addon.priceLabel ?? addon.price ?? '';
        return (
          <ChoiceRow
            key={addon.id}
            accessibilityRole="checkbox"
            rightLabel={priceLine}
            selected={selected}
            subtitle={null}
            title={addon.name}
            onPress={() => onToggleAddon(addon.id)}
          />
        );
      })}

      <View style={styles.summarySection}>
        <DetailsSectionCard bodyPadding="roomy" title="Summary">
          <View style={styles.serviceRow}>
            <AppText numberOfLines={2} style={styles.serviceName}>
              {service.name}
            </AppText>
            <AppText style={styles.servicePrice}>{headerOptionPrice}</AppText>
          </View>
          {selectedPricingOption ? (
            <AppText style={styles.optionSummaryLine}>{selectedPricingOption.label}</AppText>
          ) : (
            <View style={{ height: 4 }} />
          )}

          {selectedAddonRows.length > 0 ? (
            <>
              <Divider style={styles.serviceDivider} />
              <View style={styles.addonBlock}>
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
              </View>
            </>
          ) : null}

          <Divider style={styles.divider} />
          <View style={styles.totalRow}>
            <AppText style={styles.totalLabel}>Quoted amount</AppText>
            <AppText style={styles.totalValue}>{formatUsdFromNumber(totalUsd)}</AppText>
          </View>
        </DetailsSectionCard>
      </View>
    </View>
  );
}
