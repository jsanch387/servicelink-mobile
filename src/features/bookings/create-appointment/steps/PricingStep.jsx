import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Divider, SurfaceCard } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { CreateFlowServiceHeader } from '../components/CreateFlowServiceHeader';
import { ChoiceRow } from '../components/ChoiceRow';
import { buildPricingOptionsForUi } from '../utils/buildPricingOptionsForUi';

/**
 * @param {{
 *   service: object | null;
 *   pricingOptions?: Array<{ id: string; label: string; durationLabel: string; priceLabel: string }> | null;
 *   selectedPricingId: string | null;
 *   onSelectPricingId: (id: string) => void;
 * }} props
 */
export function PricingStep({ service, pricingOptions, selectedPricingId, onSelectPricingId }) {
  const { colors } = useTheme();

  const options = useMemo(() => {
    if (pricingOptions?.length) {
      return pricingOptions;
    }
    return buildPricingOptionsForUi(service);
  }, [pricingOptions, service]);

  const selectedOption = useMemo(
    () => options.find((o) => o.id === selectedPricingId) ?? null,
    [options, selectedPricingId],
  );

  const displayPrice = selectedOption?.priceLabel ?? service?.priceLabel ?? '—';
  const metaLine = selectedOption
    ? `${selectedOption.durationLabel} • ${selectedOption.label}`
    : (service?.durationLabel ?? '—');

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
          gap: 0,
          marginTop: 20,
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        summaryLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 11,
          letterSpacing: 0.5,
          marginBottom: 10,
          textTransform: 'uppercase',
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
          fontSize: 14,
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
      <CreateFlowServiceHeader
        displayPrice={displayPrice}
        metaLine={metaLine}
        serviceName={service.name}
      />

      <AppText style={styles.sectionTitle}>Choose an option</AppText>

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

      <SurfaceCard padding="none" style={styles.summaryCard}>
        <AppText style={styles.summaryLabel}>Service</AppText>
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
      </SurfaceCard>
    </View>
  );
}
