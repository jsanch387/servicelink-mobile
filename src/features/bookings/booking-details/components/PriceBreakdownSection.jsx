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
      {formattedPrice.hasSessionFees
        ? formattedPrice.sessionFees.map((item) => (
            <LabelValueRow
              key={item.id}
              label={item.name}
              labelPrefixIcon="receipt-outline"
              value={item.priceLabel}
            />
          ))
        : null}
      {formattedPrice.hasPaymentAdjustments
        ? formattedPrice.paymentAdjustments.map((item) => (
            <LabelValueRow key={item.id} label={item.label} value={item.value} />
          ))
        : null}
      <View style={styles.dividerWrap}>
        <Divider />
      </View>
      <LabelValueRow emphasize label="Total" noTopMargin value={formattedPrice.total} />
    </DetailsSectionCard>
  );
}
