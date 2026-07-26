import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard, Divider } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { ChoiceRow } from '../components/ChoiceRow';
import { EditJobPriceSheet } from '../components/EditJobPriceSheet';
import { EditablePriceTap } from '../components/EditablePriceTap';
import { formatUsdFromNumber, parsePriceLabelToUsd } from '../utils/priceLabelMath';
import { reviewPricingOptionLabel } from '../utils/createFlowPricing';

/**
 * @param {{
 *   service: object | null;
 *   pricingOptions?: Array<{ id: string; label: string; durationLabel: string; priceLabel: string }> | null;
 *   priceOptionsLoading?: boolean;
 *   selectedPricingId: string | null;
 *   onSelectPricingId: (id: string) => void;
 *   catalogPriceUsdText?: string;
 *   catalogPriceError?: string;
 *   onCatalogPriceUsdTextChange?: (value: string) => void;
 * }} props
 */
export function PricingStep({
  service,
  pricingOptions,
  priceOptionsLoading = false,
  selectedPricingId,
  onSelectPricingId,
  catalogPriceUsdText = '',
  onCatalogPriceUsdTextChange,
}) {
  const { colors } = useTheme();
  const [priceSheetOpen, setPriceSheetOpen] = useState(false);

  const options = useMemo(() => pricingOptions ?? [], [pricingOptions]);

  const selectedOption = useMemo(
    () => options.find((o) => o.id === selectedPricingId) ?? null,
    [options, selectedPricingId],
  );

  const catalogListPrice = selectedOption?.priceLabel ?? service?.priceLabel ?? null;
  const displayPrice = catalogPriceUsdText.trim()
    ? formatUsdFromNumber(parsePriceLabelToUsd(catalogPriceUsdText))
    : (catalogListPrice ?? '—');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        summarySection: {
          marginTop: 20,
        },
        summaryTopRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        summaryMainCol: {
          flex: 1,
          marginRight: 12,
          minWidth: 0,
        },
        summaryPriceCol: {
          alignItems: 'flex-end',
        },
        summaryTitle: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
        },
        summarySub: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
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
          fontSize: 16,
          fontWeight: '700',
        },
        empty: {
          color: colors.textMuted,
          fontSize: 14,
        },
        loading: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          marginBottom: 8,
        },
      }),
    [colors],
  );

  if (!service) {
    return <AppText style={styles.empty}>Select a service first.</AppText>;
  }

  const canEditPrice = Boolean(onCatalogPriceUsdTextChange && selectedOption);
  const optionLabel = reviewPricingOptionLabel({
    selectedServiceId: service?.id,
    selectedPricingOption: selectedOption,
  });

  return (
    <View>
      {priceOptionsLoading && options.length === 0 ? (
        <AppText style={styles.loading}>Loading pricing…</AppText>
      ) : null}

      {options.map((opt) => (
        <ChoiceRow
          key={opt.id}
          rightLabel={opt.priceLabel}
          selected={selectedPricingId === opt.id}
          subtitle={opt.durationLabel}
          title={opt.label}
          onPress={() => onSelectPricingId(opt.id)}
        />
      ))}

      <View style={styles.summarySection}>
        <DetailsSectionCard
          bodyPadding="roomy"
          title="Summary"
          titleRight={
            canEditPrice ? <EditablePriceTap onPress={() => setPriceSheetOpen(true)} /> : null
          }
        >
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryMainCol}>
              <AppText numberOfLines={2} style={styles.summaryTitle}>
                {service.name}
              </AppText>
              {optionLabel ? (
                <AppText style={styles.summarySub}>{optionLabel}</AppText>
              ) : selectedOption ? null : (
                <AppText style={styles.summarySub}>Select a tier</AppText>
              )}
            </View>
            <View style={styles.summaryPriceCol}>
              <AppText style={styles.totalValue}>{displayPrice}</AppText>
            </View>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.totalRow}>
            <AppText style={styles.totalLabel}>Total</AppText>
            <AppText style={styles.totalValue}>{displayPrice}</AppText>
          </View>
        </DetailsSectionCard>
      </View>

      {onCatalogPriceUsdTextChange ? (
        <EditJobPriceSheet
          initialUsdText={catalogPriceUsdText}
          visible={priceSheetOpen}
          onClose={() => setPriceSheetOpen(false)}
          onSave={onCatalogPriceUsdTextChange}
        />
      ) : null}
    </View>
  );
}
