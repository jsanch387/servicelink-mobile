import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../../theme';
import { DetailsSectionCard } from './DetailsSectionCard';
import { LabelValueRow } from './LabelValueRow';

export function PriceBreakdownSection({ formattedPrice }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        divider: {
          backgroundColor: colors.border,
          height: 1,
          marginTop: 10,
        },
      }),
    [colors],
  );

  return (
    <DetailsSectionCard title="Price breakdown">
      <LabelValueRow label="Service" noTopMargin value={formattedPrice.servicePrice} />
      {formattedPrice.hasAddOns
        ? formattedPrice.addOns.map((item) => (
            <LabelValueRow
              key={item.id}
              label={item.name}
              labelPrefixIcon="add"
              value={item.priceLabel}
            />
          ))
        : null}
      <View style={styles.divider} />
      <LabelValueRow emphasize label="Total" value={formattedPrice.total} />
    </DetailsSectionCard>
  );
}
