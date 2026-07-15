import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard, Divider } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { ChoiceRow } from '../components/ChoiceRow';

/**
 * @param {{
 *   service: object | null;
 *   pricingOptions?: Array<{ id: string; label: string; durationLabel: string; priceLabel: string }> | null;
 *   priceOptionsLoading?: boolean;
 *   selectedPricingId: string | null;
 *   onSelectPricingId: (id: string) => void;
 * }} props
 */
export function PricingStep({
  service,
  pricingOptions,
  priceOptionsLoading = false,
  selectedPricingId,
  onSelectPricingId,
}) {
  const { colors } = useTheme();

  const options = useMemo(() => pricingOptions ?? [], [pricingOptions]);

  const selectedOption = useMemo(
    () => options.find((o) => o.id === selectedPricingId) ?? null,
    [options, selectedPricingId],
  );

  const displayPrice = selectedOption?.priceLabel ?? service?.priceLabel ?? '—';

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
        loading: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          marginBottom: 12,
        },
      }),
    [colors],
  );

  if (!service) {
    return <AppText style={styles.empty}>Select a service first.</AppText>;
  }

  return (
    <View>
      {priceOptionsLoading && options.length === 0 ? (
        <AppText style={styles.loading}>Loading pricing options…</AppText>
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
            <AppText style={styles.totalLabel}>Total</AppText>
            <AppText style={styles.totalValue}>{displayPrice}</AppText>
          </View>
        </DetailsSectionCard>
      </View>
    </View>
  );
}
