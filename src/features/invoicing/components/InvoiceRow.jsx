import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { invoiceRowModel } from '../utils/invoicePresentation';
import { InvoiceStatusPill } from './InvoiceStatusPill';

/**
 * Invoice card: customer and status on top, amount / number / date underneath.
 *
 * @param {object} props
 * @param {object} props.invoice
 * @param {() => void} [props.onPress] Omit while opening one invoice is out of scope.
 */
export function InvoiceRow({ invoice, onPress }) {
  const { colors } = useTheme();
  const model = useMemo(() => invoiceRowModel(invoice), [invoice]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        headRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
          width: '100%',
        },
        nameCol: {
          flex: 1,
          minWidth: 0,
        },
        customerName: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 17,
          letterSpacing: -0.3,
          lineHeight: 22,
        },
        email: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          letterSpacing: -0.1,
          lineHeight: 18,
          marginTop: 2,
        },
        pressed: {
          opacity: 0.88,
        },
        pillCol: {
          flexShrink: 0,
          marginTop: 1,
        },
        divider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginBottom: 12,
          marginTop: 14,
          width: '100%',
        },
        details: {
          flexDirection: 'row',
          gap: 8,
          width: '100%',
        },
        stat: {
          flex: 1,
          minWidth: 0,
        },
        statLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 12,
          letterSpacing: -0.05,
          lineHeight: 16,
        },
        statValue: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
          letterSpacing: -0.2,
          lineHeight: 18,
          marginTop: 4,
        },
        statValueVoid: {
          color: colors.textMuted,
          textDecorationLine: 'line-through',
        },
      }),
    [colors],
  );

  const email = String(invoice.customerEmail ?? '').trim();
  const card = (
    <SurfaceCard padding="none" style={styles.card}>
      <View style={styles.headRow}>
        <View style={styles.nameCol}>
          <AppText numberOfLines={1} style={styles.customerName}>
            {invoice.customerName}
          </AppText>
          {email ? (
            <AppText numberOfLines={1} style={styles.email}>
              {email}
            </AppText>
          ) : null}
        </View>
        <View style={styles.pillCol}>
          <InvoiceStatusPill label={model.statusLabel} status={invoice.status} />
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.details}>
        <View style={styles.stat}>
          <AppText style={styles.statLabel}>Amount</AppText>
          <AppText
            numberOfLines={1}
            style={[styles.statValue, model.voided && styles.statValueVoid]}
          >
            {model.amountLabel}
          </AppText>
        </View>
        <View style={styles.stat}>
          <AppText style={styles.statLabel}>No</AppText>
          <AppText numberOfLines={1} style={styles.statValue}>
            {model.numberLabel}
          </AppText>
        </View>
        <View style={styles.stat}>
          <AppText style={styles.statLabel}>Date</AppText>
          <AppText numberOfLines={1} style={styles.statValue}>
            {model.dateLabel}
          </AppText>
        </View>
      </View>
    </SurfaceCard>
  );

  if (!onPress) return card;

  return (
    <Pressable
      accessibilityHint="Opens the invoice"
      accessibilityLabel={`Invoice for ${invoice.customerName}`}
      accessibilityRole="button"
      onPress={onPress}
    >
      {({ pressed }) => <View style={pressed ? styles.pressed : null}>{card}</View>}
    </Pressable>
  );
}
