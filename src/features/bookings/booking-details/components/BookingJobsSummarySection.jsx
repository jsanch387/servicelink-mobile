import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Divider, MembershipMark, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { bookingPaymentFooter } from '../utils/bookingPaymentFooter';

const CARD_BG = '#161616';
const FOOTER_BG = '#1A1A1A';
const FOOTER_DIVIDER = '#222222';
const DUE_AMBER = '#F5B83D';
const ADDON_GRAY = '#D4D4D4';

/**
 * Service, add-ons, total, and payment status in one card.
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
 *     hasTax?: boolean;
 *     tax?: { label?: string; value?: string } | null;
 *     hasSessionFees?: boolean;
 *     sessionFees?: Array<{ id?: string; name?: string; priceLabel?: string }>;
 *     hasSessionDiscounts?: boolean;
 *     sessionDiscounts?: Array<{ id?: string; name?: string; priceLabel?: string }>;
 *     total?: string;
 *   };
 *   isMembershipVisit?: boolean;
 *   payment?: object | null;
 *   sharedVehicle?: string;
 * }} props
 */
export function BookingJobsSummarySection({
  jobs,
  formattedPrice,
  isMembershipVisit = false,
  payment = null,
  sharedVehicle = '',
}) {
  const { colors } = useTheme();
  const list = Array.isArray(jobs) ? jobs : [];
  const footer = bookingPaymentFooter(payment);
  const collected = formattedPrice?.collected ?? [];
  const showSubtotal = Boolean(formattedPrice?.showSubtotal);
  const hasDeposit = collected.length > 0;
  const amountLabel = hasDeposit ? 'Balance' : 'Total';
  const amountValue = formattedPrice?.balance || formattedPrice?.total || '—';
  const sharedVehicleLine = String(sharedVehicle ?? '').trim();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: CARD_BG,
          borderRadius: 16,
          overflow: 'hidden',
          paddingHorizontal: 0,
          paddingVertical: 0,
        },
        body: {
          paddingBottom: 8,
          paddingHorizontal: 16,
          paddingTop: 16,
        },
        jobTopRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          width: '100%',
        },
        jobMainCol: {
          flex: 1,
          minWidth: 0,
          paddingRight: 12,
        },
        serviceNameRow: {
          alignItems: 'center',
          flexDirection: 'row',
          minWidth: 0,
          width: '100%',
        },
        serviceNameCol: {
          flex: 1,
          flexShrink: 1,
          minWidth: 0,
        },
        serviceName: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.3,
        },
        membershipMark: {
          marginLeft: 6,
        },
        metaLine: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '400',
          marginBottom: 8,
          marginTop: 2,
        },
        priceCol: {
          alignItems: 'flex-end',
          flexShrink: 0,
          justifyContent: 'flex-start',
        },
        servicePrice: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        addons: {
          gap: 4,
          marginTop: 8,
        },
        addonRow: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        addonNameCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
          paddingRight: 12,
        },
        addonPriceCol: {
          flexShrink: 0,
          justifyContent: 'center',
        },
        addonName: {
          color: ADDON_GRAY,
          fontSize: 14,
          fontWeight: '400',
        },
        addonPrice: {
          color: ADDON_GRAY,
          fontSize: 14,
          fontWeight: '400',
        },
        jobDivider: {
          marginVertical: 10,
          opacity: 1,
        },
        footerDivider: {
          marginBottom: 8,
          marginTop: 10,
          opacity: 1,
        },
        balanceFooter: {
          alignItems: 'center',
          backgroundColor: FOOTER_BG,
          borderTopColor: FOOTER_DIVIDER,
          borderTopWidth: 1,
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 12,
          width: '100%',
        },
        balanceLabelCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        balanceValueCol: {
          alignItems: 'flex-end',
          justifyContent: 'center',
          marginLeft: 12,
        },
        adjustmentRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 6,
          width: '100%',
        },
        adjustmentLabelCol: {
          flex: 1,
          minWidth: 0,
          paddingRight: 12,
        },
        adjustmentLabel: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '400',
        },
        adjustmentValue: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '400',
        },
        collectedValue: {
          color: colors.moneyPositive,
          fontSize: 13,
          fontWeight: '400',
        },
        discountLabel: {
          color: colors.moneyPositive,
          fontSize: 13,
          fontWeight: '400',
        },
        discountValue: {
          color: colors.moneyPositive,
          fontSize: 13,
          fontWeight: '400',
        },
        totalLabel: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '700',
          letterSpacing: -0.2,
        },
        totalValue: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.2,
        },
        payMethod: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '400',
        },
        payBadge: {
          fontSize: 12,
          fontWeight: '600',
        },
        payDetail: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          marginTop: 6,
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

  const badgeColor =
    footer?.tone === 'due'
      ? DUE_AMBER
      : footer?.tone === 'paid'
        ? colors.moneyPositive
        : colors.textMuted;

  return (
    <SurfaceCard padding="none" style={styles.card}>
      <View style={styles.body}>
        {list.map((job, index) => {
          const addonRows = job.addOns ?? [];
          const ownVehicle = String(job.vehicleLine ?? '').trim();
          const vehicleLine = ownVehicle || (list.length === 1 ? sharedVehicleLine : '');
          return (
            <View key={job.id ?? `job-card-${index}`}>
              {index > 0 ? <Divider style={styles.jobDivider} /> : null}
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
                    <View style={styles.serviceNameCol}>
                      <AppText ellipsizeMode="tail" numberOfLines={1} style={styles.serviceName}>
                        {job.serviceName || '—'}
                      </AppText>
                    </View>
                    {isMembershipVisit ? <MembershipMark style={styles.membershipMark} /> : null}
                  </View>
                  {vehicleLine ? (
                    <AppText numberOfLines={1} style={styles.metaLine}>
                      {vehicleLine}
                    </AppText>
                  ) : null}
                </View>
                <View style={styles.priceCol}>
                  <AppText style={styles.servicePrice}>{job.servicePriceLabel || '—'}</AppText>
                </View>
              </View>
              {addonRows.length > 0 ? (
                <View style={styles.addons}>
                  {addonRows.map((addon, addonIndex) => (
                    <View
                      key={String(addon.id ?? `${index}-addon-${addonIndex}`)}
                      style={styles.addonRow}
                    >
                      <View style={styles.addonNameCol}>
                        <AppText ellipsizeMode="tail" numberOfLines={1} style={styles.addonName}>
                          {addon.name}
                        </AppText>
                      </View>
                      <View style={styles.addonPriceCol}>
                        <AppText style={styles.addonPrice}>{addon.priceLabel}</AppText>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}

        {showSubtotal ? <Divider style={styles.footerDivider} /> : null}

        {showSubtotal ? (
          <View style={styles.adjustmentRow}>
            <View style={styles.adjustmentLabelCol}>
              <AppText numberOfLines={1} style={styles.adjustmentLabel}>
                Subtotal
              </AppText>
            </View>
            <AppText style={styles.adjustmentValue}>{formattedPrice.subtotal}</AppText>
          </View>
        ) : null}
        {formattedPrice?.hasDiscount && formattedPrice.discount ? (
          <View style={styles.adjustmentRow}>
            <View style={styles.adjustmentLabelCol}>
              <AppText numberOfLines={2} style={styles.discountLabel}>
                {formattedPrice.discount.label}
              </AppText>
            </View>
            <AppText style={styles.discountValue}>{formattedPrice.discount.value}</AppText>
          </View>
        ) : null}
        {formattedPrice?.hasSessionFees
          ? (formattedPrice.sessionFees ?? []).map((item) => (
              <View key={item.id} style={styles.adjustmentRow}>
                <View style={styles.adjustmentLabelCol}>
                  <AppText numberOfLines={2} style={styles.adjustmentLabel}>
                    {item.name}
                  </AppText>
                </View>
                <AppText style={styles.adjustmentValue}>{item.priceLabel}</AppText>
              </View>
            ))
          : null}
        {formattedPrice?.hasSessionDiscounts
          ? (formattedPrice.sessionDiscounts ?? []).map((item) => (
              <View key={item.id} style={styles.adjustmentRow}>
                <View style={styles.adjustmentLabelCol}>
                  <AppText numberOfLines={2} style={styles.discountLabel}>
                    {item.name}
                  </AppText>
                </View>
                <AppText style={styles.discountValue}>{item.priceLabel}</AppText>
              </View>
            ))
          : null}
        {formattedPrice?.hasTax && formattedPrice.tax ? (
          <View style={styles.adjustmentRow}>
            <View style={styles.adjustmentLabelCol}>
              <AppText numberOfLines={1} style={styles.adjustmentLabel}>
                {formattedPrice.tax.label}
              </AppText>
            </View>
            <AppText style={styles.adjustmentValue}>{formattedPrice.tax.value}</AppText>
          </View>
        ) : null}
        {formattedPrice?.hasTip && formattedPrice.tip ? (
          <View style={styles.adjustmentRow}>
            <View style={styles.adjustmentLabelCol}>
              <AppText numberOfLines={1} style={styles.adjustmentLabel}>
                {formattedPrice.tip.label}
              </AppText>
            </View>
            <AppText style={styles.adjustmentValue}>{formattedPrice.tip.value}</AppText>
          </View>
        ) : null}
        {collected.map((item) => (
          <View key={item.id} style={styles.adjustmentRow}>
            <View style={styles.adjustmentLabelCol}>
              <AppText numberOfLines={1} style={styles.adjustmentLabel}>
                {item.label}
              </AppText>
            </View>
            <AppText style={styles.collectedValue}>{item.value}</AppText>
          </View>
        ))}

        {footer?.detail ? <AppText style={styles.payDetail}>{footer.detail}</AppText> : null}

        {isMembershipVisit ? (
          <AppText style={styles.membershipHint}>Included in membership</AppText>
        ) : null}
      </View>

      <View
        accessibilityLabel={`${amountLabel} ${amountValue}${footer?.accessibilityLabel ? `. ${footer.accessibilityLabel}` : ''}`}
        style={styles.balanceFooter}
      >
        <View style={styles.balanceLabelCol}>
          <AppText style={styles.totalLabel}>{amountLabel}</AppText>
          {footer?.method ? (
            <AppText numberOfLines={1} style={styles.payMethod}>
              {footer.method}
            </AppText>
          ) : null}
        </View>
        <View style={styles.balanceValueCol}>
          <AppText style={styles.totalValue}>{amountValue}</AppText>
          {footer?.badge ? (
            <AppText numberOfLines={1} style={[styles.payBadge, { color: badgeColor }]}>
              {footer.badge}
            </AppText>
          ) : null}
        </View>
      </View>
    </SurfaceCard>
  );
}
