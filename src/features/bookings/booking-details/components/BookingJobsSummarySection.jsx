import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Divider, MembershipMark } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/**
 * Multi-job summary cards — matches create-appointment Review job cards
 * (service + price, option, vehicle, add-ons) plus visit total.
 *
 * @param {{
 *   jobs: Array<{
 *     id?: string;
 *     serviceName?: string;
 *     pricingOption?: string | null;
 *     vehicleLine?: string;
 *     servicePriceLabel?: string;
 *     addOns?: Array<{ id?: string; name?: string; priceLabel?: string }>;
 *   }>;
 *   formattedPrice: {
 *     hasDiscount?: boolean;
 *     discount?: { label?: string; value?: string } | null;
 *     hasSessionFees?: boolean;
 *     sessionFees?: Array<{ id?: string; name?: string; priceLabel?: string }>;
 *     total?: string;
 *   };
 *   isMembershipVisit?: boolean;
 * }} props
 */
export function BookingJobsSummarySection({ jobs, formattedPrice, isMembershipVisit = false }) {
  const { colors } = useTheme();
  const list = Array.isArray(jobs) ? jobs : [];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          rowGap: 8,
        },
        sectionTitle: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        jobsStack: {
          gap: 10,
        },
        jobCard: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          paddingHorizontal: 12,
          paddingVertical: 12,
        },
        jobTopRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        jobMainCol: {
          flex: 1,
          marginRight: 12,
          minWidth: 0,
        },
        serviceNameRow: {
          alignItems: 'center',
          flexDirection: 'row',
          flexWrap: 'wrap',
          minWidth: 0,
        },
        jobPriceCol: {
          alignItems: 'flex-end',
        },
        serviceName: {
          color: colors.text,
          flexShrink: 1,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.3,
          minWidth: 0,
        },
        servicePrice: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.3,
        },
        optionMetaLine: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
        },
        vehicleMetaTextSolo: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          marginTop: 10,
        },
        serviceDivider: {
          marginBottom: 10,
          marginTop: 12,
        },
        addonRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
          paddingLeft: 2,
        },
        addonRowLast: {
          marginBottom: 0,
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
        totalCard: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          paddingHorizontal: 12,
          paddingVertical: 14,
        },
        discountRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 10,
        },
        discountLabel: {
          color: colors.textSuccess ?? colors.text,
          flex: 1,
          fontSize: 13,
          fontWeight: '500',
          marginRight: 12,
        },
        discountValue: {
          color: colors.textSuccess ?? colors.text,
          fontSize: 13,
          fontWeight: '600',
        },
        feeRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 10,
        },
        feeLabel: {
          color: colors.textSecondary,
          flex: 1,
          fontSize: 13,
          fontWeight: '500',
          marginRight: 12,
        },
        feeValue: {
          color: colors.textSecondary,
          fontSize: 13,
          fontWeight: '600',
        },
        totalRow: {
          alignItems: 'baseline',
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
        membershipHint: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
          marginTop: 8,
        },
      }),
    [colors],
  );

  if (list.length === 0) return null;

  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>Summary</AppText>
      <View style={styles.jobsStack}>
        {list.map((job, index) => {
          const addonRows = job.addOns ?? [];
          const optionLabel = String(job.pricingOption ?? '').trim();
          const vehicleLine = String(job.vehicleLine ?? '').trim();
          return (
            <View key={job.id ?? `job-card-${index}`} style={styles.jobCard}>
              <View style={styles.jobTopRow}>
                <View style={styles.jobMainCol}>
                  <View
                    accessibilityLabel={
                      isMembershipVisit
                        ? `${job.serviceName || 'Service'}, subscription visit`
                        : undefined
                    }
                    style={styles.serviceNameRow}
                  >
                    <AppText numberOfLines={3} style={styles.serviceName}>
                      {job.serviceName || '—'}
                    </AppText>
                    {isMembershipVisit ? <MembershipMark /> : null}
                  </View>
                  {optionLabel ? (
                    <AppText style={styles.optionMetaLine}>{optionLabel}</AppText>
                  ) : null}
                  {vehicleLine ? (
                    <AppText numberOfLines={1} style={styles.vehicleMetaTextSolo}>
                      {vehicleLine}
                    </AppText>
                  ) : null}
                </View>
                <View style={styles.jobPriceCol}>
                  <AppText style={styles.servicePrice}>{job.servicePriceLabel || '—'}</AppText>
                </View>
              </View>
              {addonRows.length > 0 ? (
                <>
                  <Divider style={styles.serviceDivider} />
                  {addonRows.map((a, addonIndex) => (
                    <View
                      key={String(a.id ?? `${index}-addon-${addonIndex}`)}
                      style={[
                        styles.addonRow,
                        addonIndex === addonRows.length - 1 ? styles.addonRowLast : null,
                      ]}
                    >
                      <AppText numberOfLines={2} style={styles.addonName}>
                        {a.name}
                      </AppText>
                      <AppText style={styles.addonPrice}>{a.priceLabel}</AppText>
                    </View>
                  ))}
                </>
              ) : null}
            </View>
          );
        })}

        <View style={styles.totalCard}>
          {formattedPrice?.hasDiscount && formattedPrice.discount ? (
            <View style={styles.discountRow}>
              <AppText numberOfLines={2} style={styles.discountLabel}>
                {formattedPrice.discount.label}
              </AppText>
              <AppText style={styles.discountValue}>{formattedPrice.discount.value}</AppText>
            </View>
          ) : null}
          {formattedPrice?.hasSessionFees
            ? (formattedPrice.sessionFees ?? []).map((item) => (
                <View key={item.id} style={styles.feeRow}>
                  <AppText numberOfLines={2} style={styles.feeLabel}>
                    {item.name}
                  </AppText>
                  <AppText style={styles.feeValue}>{item.priceLabel}</AppText>
                </View>
              ))
            : null}
          <View style={styles.totalRow}>
            <AppText style={styles.totalLabel}>Visit total</AppText>
            <AppText style={styles.totalValue}>{formattedPrice?.total || '—'}</AppText>
          </View>
          {isMembershipVisit ? (
            <AppText style={styles.membershipHint}>Included in membership</AppText>
          ) : null}
        </View>
      </View>
    </View>
  );
}
