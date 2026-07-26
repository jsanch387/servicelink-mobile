import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard, Divider } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { ChoiceRow } from '../components/ChoiceRow';
import { EditJobPriceSheet } from '../components/EditJobPriceSheet';
import { EditablePriceTap } from '../components/EditablePriceTap';
import { formatUsdFromNumber, parsePriceLabelToUsd } from '../utils/priceLabelMath';
import { reviewPricingOptionLabel } from '../utils/createFlowPricing';

export function AddonsStep({
  service,
  selectedPricingOption,
  serviceAddons,
  selectedAddonIds,
  onToggleAddon,
  catalogPriceUsdText = '',
  onCatalogPriceUsdTextChange,
}) {
  const { colors } = useTheme();
  const [priceSheetOpen, setPriceSheetOpen] = useState(false);

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
          marginBottom: 0,
        },
        serviceName: {
          color: colors.text,
          flex: 1,
          fontSize: 16,
          fontWeight: '600',
          marginRight: 12,
        },
        optionSummaryLine: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 0,
          marginTop: 2,
        },
        serviceDivider: {
          marginBottom: 12,
          marginTop: 14,
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
          marginTop: 14,
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
        emptyWrap: {
          alignItems: 'center',
          alignSelf: 'stretch',
          marginTop: 24,
          paddingHorizontal: 8,
        },
        emptyTitle: {
          color: colors.textSecondary,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.2,
          textAlign: 'center',
        },
        emptyBody: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 21,
          marginTop: 8,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  if (!service) {
    return <AppText style={styles.empty}>Select a service first.</AppText>;
  }

  const addons = serviceAddons ?? [];
  const canEditPrice = typeof onCatalogPriceUsdTextChange === 'function';
  const optionLabel = reviewPricingOptionLabel({
    selectedServiceId: service?.id,
    selectedPricingOption,
  });

  const summaryCard = (
    <DetailsSectionCard
      bodyPadding="roomy"
      title="Summary"
      titleRight={
        canEditPrice ? <EditablePriceTap onPress={() => setPriceSheetOpen(true)} /> : null
      }
    >
      <View style={styles.serviceRow}>
        <AppText numberOfLines={2} style={styles.serviceName}>
          {service.name}
        </AppText>
        <AppText style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
          {headerOptionPrice}
        </AppText>
      </View>
      {optionLabel ? (
        <AppText style={styles.optionSummaryLine}>{optionLabel}</AppText>
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
        <AppText style={styles.totalLabel}>Total</AppText>
        <AppText style={styles.totalValue}>{formatUsdFromNumber(totalUsd)}</AppText>
      </View>
    </DetailsSectionCard>
  );

  const priceSheet = canEditPrice ? (
    <EditJobPriceSheet
      initialUsdText={catalogPriceUsdText}
      visible={priceSheetOpen}
      onClose={() => setPriceSheetOpen(false)}
      onSave={onCatalogPriceUsdTextChange}
    />
  ) : null;

  if (addons.length === 0) {
    return (
      <View>
        <View style={styles.emptyWrap}>
          <AppText style={styles.emptyTitle}>No add-ons for this service</AppText>
          <AppText style={styles.emptyBody}>Tap Continue to keep going.</AppText>
        </View>
        <View style={styles.summarySection}>{summaryCard}</View>
        {priceSheet}
      </View>
    );
  }

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

      <View style={styles.summarySection}>{summaryCard}</View>
      {priceSheet}
    </View>
  );
}
