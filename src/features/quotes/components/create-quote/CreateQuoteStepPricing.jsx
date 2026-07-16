import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard, Divider } from '../../../../components/ui';
import { ChoiceRow } from '../../../bookings/create-appointment/components/ChoiceRow';
import {
  formatUsdFromNumber,
  parsePriceLabelToUsd,
} from '../../../bookings/create-appointment/utils/priceLabelMath';
import { useTheme } from '../../../../theme';

/**
 * Catalog pricing options for a quote (mirrors create-appointment PricingStep).
 *
 * @param {{
 *   service: { name: string } | null;
 *   pricingOptions?: Array<{ id: string; label: string; durationLabel: string; priceLabel: string }> | null;
 *   selectedPricingId: string | null;
 *   onSelectPricingId: (id: string) => void;
 * }} props
 */
export function CreateQuoteStepPricing({
  service,
  pricingOptions,
  selectedPricingId,
  onSelectPricingId,
}) {
  const { colors } = useTheme();
  const options = useMemo(() => pricingOptions ?? [], [pricingOptions]);
  const selectedOption = useMemo(
    () => options.find((o) => o.id === selectedPricingId) ?? null,
    [options, selectedPricingId],
  );
  const displayPrice = selectedOption?.priceLabel ?? '—';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        summarySection: {
          marginTop: 20,
        },
        summaryRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 6,
        },
        summaryTitle: {
          color: colors.text,
          flex: 1,
          fontSize: 16,
          fontWeight: '600',
          marginRight: 12,
        },
        summaryPrice: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
        },
        summarySub: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 14,
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
        },
      }),
    [colors],
  );

  if (!service) {
    return <AppText style={styles.empty}>Select a service first.</AppText>;
  }

  return (
    <View>
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
        <DetailsSectionCard bodyPadding="roomy" title="Summary">
          <View style={styles.summaryRow}>
            <AppText numberOfLines={2} style={styles.summaryTitle}>
              {service.name}
            </AppText>
            <AppText style={styles.summaryPrice}>{displayPrice}</AppText>
          </View>
          {selectedOption ? (
            <AppText style={styles.summarySub}>{selectedOption.label}</AppText>
          ) : (
            <AppText style={styles.summarySub}>No option selected</AppText>
          )}
          <Divider style={styles.divider} />
          <View style={styles.totalRow}>
            <AppText style={styles.totalLabel}>Quoted amount</AppText>
            <AppText style={styles.totalValue}>
              {selectedOption
                ? formatUsdFromNumber(parsePriceLabelToUsd(selectedOption.priceLabel))
                : '—'}
            </AppText>
          </View>
        </DetailsSectionCard>
      </View>
    </View>
  );
}
