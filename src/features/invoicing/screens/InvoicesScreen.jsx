import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText, FilterPills, SurfaceCard } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { InvoiceList } from '../components/InvoiceList';
import { INVOICE_FILTER, INVOICE_FILTER_OPTIONS } from '../constants/invoiceStatuses';
import { MOCK_INVOICES } from '../constants/mockInvoices';
import { formatInvoiceDollars } from '../utils/formatInvoiceMoney';
import { filterInvoices, summarizeOpenInvoices } from '../utils/invoicePresentation';

export function InvoicesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const [filter, setFilter] = useState(INVOICE_FILTER.ALL);
  const summary = useMemo(() => summarizeOpenInvoices(MOCK_INVOICES), []);
  const invoices = useMemo(() => filterInvoices(MOCK_INVOICES, filter), [filter]);
  const openInvoice = useCallback(
    (invoice) => {
      navigation.navigate(ROUTES.INVOICE_DETAIL, { invoiceId: invoice.id });
    },
    [navigation],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        scroll: {
          flex: 1,
        },
        content: {
          gap: 16,
          paddingBottom: 28 + Math.max(tabBarHeight, 72),
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        summaryHeader: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        summaryLabelCol: {
          flex: 1,
          minWidth: 0,
        },
        summaryCaptionCol: {
          flexShrink: 0,
        },
        summaryLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          letterSpacing: -0.05,
          lineHeight: 18,
        },
        summaryAmount: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 32,
          letterSpacing: -0.8,
          lineHeight: 38,
          marginTop: 4,
        },
      }),
    [colors, tabBarHeight],
  );

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <SurfaceCard>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryLabelCol}>
              <AppText style={styles.summaryLabel}>Outstanding</AppText>
            </View>
            <View style={styles.summaryCaptionCol}>
              <AppText style={styles.summaryLabel}>{summary.caption}</AppText>
            </View>
          </View>
          <AppText style={styles.summaryAmount}>{formatInvoiceDollars(summary.total)}</AppText>
        </SurfaceCard>
        <FilterPills options={INVOICE_FILTER_OPTIONS} selectedKey={filter} onSelect={setFilter} />
        <InvoiceList invoices={invoices} onInvoicePress={openInvoice} />
      </ScrollView>
    </View>
  );
}
