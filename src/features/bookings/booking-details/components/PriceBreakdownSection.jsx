import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { DetailsSectionCard, Divider, LabelValueRow } from '../../../../components/ui';

/**
 * Single-job price breakdown. Multi-job visits use {@link BookingJobsSummarySection} instead.
 */
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

  if (formattedPrice?.isMultiJob) {
    return null;
  }

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
      {formattedPrice.hasDiscount && formattedPrice.discount ? (
        <LabelValueRow
          label={formattedPrice.discount.label}
          value={formattedPrice.discount.value}
        />
      ) : null}
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
      <View style={styles.dividerWrap}>
        <Divider />
      </View>
      <LabelValueRow emphasize label="Total" noTopMargin value={formattedPrice.total} />
    </DetailsSectionCard>
  );
}
