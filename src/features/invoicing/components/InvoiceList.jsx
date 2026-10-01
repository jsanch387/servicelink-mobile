import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { InvoiceRow } from './InvoiceRow';

/**
 * @param {object} props
 * @param {import('../constants/mockInvoices').MockInvoice[]} props.invoices
 * @param {(invoice: import('../constants/mockInvoices').MockInvoice) => void} props.onInvoicePress
 */
export function InvoiceList({ invoices, onInvoicePress }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: {
          gap: 10,
        },
        empty: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          lineHeight: 22,
          paddingTop: 8,
        },
      }),
    [colors],
  );

  if (!invoices.length) {
    return <AppText style={styles.empty}>No invoices in this view.</AppText>;
  }

  return (
    <View style={styles.list}>
      {invoices.map((invoice) => (
        <InvoiceRow key={invoice.id} invoice={invoice} onPress={() => onInvoicePress(invoice)} />
      ))}
    </View>
  );
}
