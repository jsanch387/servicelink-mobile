import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Divider, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { groupCompleteVisitBreakdown } from '../utils/groupCompleteVisitBreakdown';

/**
 * @param {{
 *   lineItems: Array<{ id: string; label: string; sublabel?: string | null; amount: number; kind?: string }>;
 *   adjustments: Array<{ id: string; label: string; amount: number }>;
 *   appliedPayments?: Array<{ id: string; label: string; amount: number }>;
 *   total: number;
 *   formatUsd: (amount: number) => string;
 * }} props
 */
export function CompleteVisitBreakdownCard({
  lineItems,
  adjustments,
  appliedPayments = [],
  total,
  formatUsd,
}) {
  const { colors } = useTheme();
  const grouped = useMemo(
    () => groupCompleteVisitBreakdown({ lineItems, adjustments }),
    [adjustments, lineItems],
  );
  const payments = (appliedPayments ?? []).filter((item) => item.amount > 0);
  const feeLines = grouped.adjustments.filter(
    (item) => item.tone !== 'discount' && item.amount >= 0,
  );
  const discountLines = grouped.adjustments.filter(
    (item) => item.tone === 'discount' || item.amount < 0,
  );
  const hasAdjustments = feeLines.length > 0 || discountLines.length > 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          paddingBottom: 8,
          paddingHorizontal: 16,
          paddingTop: 8,
        },
        groupDivider: {
          marginBottom: 6,
          marginTop: 6,
        },
        sectionLabel: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          marginBottom: 0,
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          paddingVertical: 6,
          width: '100%',
        },
        labelCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        labelRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          minWidth: 0,
        },
        labelTextCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '400',
          letterSpacing: -0.1,
          lineHeight: 20,
        },
        titleQuiet: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '400',
          lineHeight: 18,
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          marginTop: 1,
        },
        amountCol: {
          alignItems: 'flex-end',
          justifyContent: 'center',
        },
        amount: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 20,
        },
        amountQuiet: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
          lineHeight: 18,
        },
        discountAmount: {
          color: colors.moneyPositive,
        },
        totalSection: {
          width: '100%',
        },
        totalDivider: {
          marginBottom: 2,
          marginTop: 8,
        },
        totalRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          paddingBottom: 6,
          paddingTop: 10,
          width: '100%',
        },
        totalTitle: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
          lineHeight: 21,
        },
        totalAmount: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.3,
          lineHeight: 22,
        },
      }),
    [colors],
  );

  return (
    <SurfaceCard outlined padding="none" style={styles.card}>
      {grouped.lines.map((item) => (
        <BreakdownLine
          key={item.id}
          amountLabel={formatUsd(item.amount)}
          label={item.label}
          styles={styles}
        />
      ))}

      {hasAdjustments ? (
        <>
          {grouped.lines.length > 0 ? (
            <View style={styles.groupDivider}>
              <Divider />
            </View>
          ) : null}
          <AppText style={styles.sectionLabel}>Fees & discounts</AppText>
          {feeLines.map((item) => (
            <BreakdownLine
              key={item.id}
              amountLabel={formatUsd(item.amount)}
              label={item.label}
              styles={styles}
            />
          ))}
          {discountLines.map((item) => (
            <BreakdownLine
              key={item.id}
              amountLabel={`−${formatUsd(Math.abs(item.amount))}`}
              discount
              label={item.label}
              styles={styles}
            />
          ))}
        </>
      ) : null}

      {payments.map((item) => (
        <BreakdownLine
          key={item.id}
          amountLabel={`−${formatUsd(item.amount)}`}
          label={item.label}
          styles={styles}
        />
      ))}

      <View style={styles.totalSection}>
        <View style={styles.totalDivider}>
          <Divider />
        </View>
        {grouped.tax && grouped.tax.amount > 0 ? (
          <BreakdownLine
            amountLabel={formatUsd(grouped.tax.amount)}
            label={grouped.tax.label}
            quiet
            styles={styles}
          />
        ) : null}
        <View style={styles.totalRow}>
          <View style={styles.labelCol}>
            <AppText style={styles.totalTitle}>Total</AppText>
          </View>
          <View style={styles.amountCol}>
            <AppText style={styles.totalAmount}>{formatUsd(total)}</AppText>
          </View>
        </View>
      </View>
    </SurfaceCard>
  );
}

/**
 * @param {{
 *   label: string;
 *   subtitle?: string | null;
 *   amountLabel: string;
 *   quiet?: boolean;
 *   discount?: boolean;
 *   styles: Record<string, object>;
 * }} props
 */
function BreakdownLine({ label, subtitle, amountLabel, quiet = false, discount = false, styles }) {
  return (
    <View style={styles.row}>
      <View style={styles.labelCol}>
        <View style={styles.labelRow}>
          <View style={styles.labelTextCol}>
            <AppText
              ellipsizeMode="tail"
              numberOfLines={2}
              style={[styles.title, quiet ? styles.titleQuiet : null]}
            >
              {label}
            </AppText>
            {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
          </View>
        </View>
      </View>
      <View style={styles.amountCol}>
        <AppText
          style={[
            styles.amount,
            quiet ? styles.amountQuiet : null,
            discount ? styles.discountAmount : null,
          ]}
        >
          {amountLabel}
        </AppText>
      </View>
    </View>
  );
}
