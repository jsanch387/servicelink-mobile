import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
    </View>
  );
}
