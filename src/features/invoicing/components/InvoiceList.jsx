import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { InvoiceRow } from './InvoiceRow';

/**
 * @param {object} props
 * @param {Array<{ id: string }>} props.invoices
 * @param {(invoice: { id: string }) => void} [props.onInvoicePress]
 * @param {string} [props.emptyTitle]
 * @param {string} [props.emptyBody]
 */
export function InvoiceList({
  invoices,
  onInvoicePress,
  emptyTitle = 'No invoices yet',
  emptyBody = 'Send your customer an invoice for the work.',
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: {
          gap: 10,
        },
        empty: {
          gap: 6,
          paddingTop: 8,
        },
        emptyTitle: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 17,
          letterSpacing: -0.2,
          lineHeight: 22,
        },
        emptyBody: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          lineHeight: 21,
        },
      }),
    [colors],
  );

  if (!invoices.length) {
    return (
      <View style={styles.empty}>
        <AppText style={styles.emptyTitle}>{emptyTitle}</AppText>
        {emptyBody ? <AppText style={styles.emptyBody}>{emptyBody}</AppText> : null}
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {invoices.map((invoice) => (
        <InvoiceRow
          key={invoice.id}
          invoice={invoice}
          onPress={onInvoicePress ? () => onInvoicePress(invoice) : undefined}
        />
      ))}
    </View>
  );
}
