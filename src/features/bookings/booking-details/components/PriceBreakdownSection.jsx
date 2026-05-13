import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { DetailsSectionCard, Divider, LabelValueRow } from '../../../../components/ui';

export function PriceBreakdownSection({ formattedPrice }) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        dividerWrap: {
          marginBottom: 4,
          marginTop: 14,
        },
      }),
    [],
  );

  return (
    <DetailsSectionCard bodyPadding="roomy" title="Price breakdown">
      <LabelValueRow
        label="Service"
        labelAppearance="caption"
        noTopMargin
        value={formattedPrice.servicePrice}
      />
      {formattedPrice.hasAddOns
        ? formattedPrice.addOns.map((item) => (
            <LabelValueRow
              key={item.id}
              label={item.name}
              labelAppearance="caption"
              labelPrefixIcon="add"
              value={item.priceLabel}
            />
          ))
        : null}
      <View style={styles.dividerWrap}>
        <Divider />
      </View>
      <LabelValueRow
        emphasize
        label="Total"
        labelAppearance="caption"
        noTopMargin
        value={formattedPrice.total}
      />
    </DetailsSectionCard>
  );
}
