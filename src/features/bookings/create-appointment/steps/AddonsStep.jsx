import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Divider, SurfaceCard } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { ChoiceRow } from '../components/ChoiceRow';
import { CreateFlowServiceHeader } from '../components/CreateFlowServiceHeader';
import { formatUsdFromNumber, parsePriceLabelToUsd } from '../utils/priceLabelMath';

export function AddonsStep({
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

  const metaLine = selectedPricingOption
    ? `${selectedPricingOption.durationLabel} — ${selectedPricingOption.label}`
    : (service?.durationLabel ?? '—');

  /** Selected option base price only — does not change when add-ons are toggled. */
  const headerOptionPrice =
    selectedPricingOption?.priceLabel ?? service?.priceLabel ?? formatUsdFromNumber(0);

  const selectedAddonRows = useMemo(() => {
    const list = serviceAddons ?? [];
    return list.filter((a) => selectedAddonIds.includes(a.id));
  }, [serviceAddons, selectedAddonIds]);

  const addonsUsdSum = selectedAddonRows.reduce(
    (s, a) => s + parsePriceLabelToUsd(a.priceLabel ?? a.price),
    0,
  );
  const totalUsd = baseUsd + addonsUsdSum;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        sectionTitle: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.2,
          marginBottom: 12,
        },
        summaryCard: {
          marginTop: 20,
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        summaryHeading: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 11,
          letterSpacing: 0.5,
          marginBottom: 12,
          textTransform: 'uppercase',
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
          marginBottom: 16,
        },
        addonBlock: {
          marginTop: 4,
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
          lineHeight: 20,
        },
      }),
    [colors],
  );

  if (!service) {
    return <AppText style={styles.empty}>Select a service first.</AppText>;
  }

  const addons = serviceAddons ?? [];

  if (addons.length === 0) {
    return (
      <View>
        <CreateFlowServiceHeader
          displayPrice={headerOptionPrice}
          metaLine={metaLine}
          serviceName={service.name}
        />
        <AppText style={styles.empty}>
          No add-ons are assigned to this service yet. Tap Continue.
        </AppText>
      </View>
    );
  }

  return (
    <View>
      <CreateFlowServiceHeader
        displayPrice={headerOptionPrice}
        metaLine={metaLine}
        serviceName={service.name}
      />

      <AppText style={styles.sectionTitle}>Optional add-ons</AppText>

      {addons.map((addon) => {
        const selected = selectedAddonIds.includes(addon.id);
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

      <SurfaceCard padding="none" style={styles.summaryCard}>
        <AppText style={styles.summaryHeading}>Summary</AppText>

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
        ) : null}

        <Divider style={styles.divider} />
        <View style={styles.totalRow}>
          <AppText style={styles.totalLabel}>Total</AppText>
          <AppText style={styles.totalValue}>{formatUsdFromNumber(totalUsd)}</AppText>
        </View>
      </SurfaceCard>
    </View>
  );
}
