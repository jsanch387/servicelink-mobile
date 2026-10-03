import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FilterPills } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { AddInvoiceFab } from '../components/AddInvoiceFab';
import { InvoiceList } from '../components/InvoiceList';
import { InvoiceSearchBar } from '../components/InvoiceSearchBar';
import { CREATE_INVOICE_SOURCE } from '../constants/createInvoiceWizard';
import { INVOICE_FILTER, INVOICE_FILTER_OPTIONS } from '../constants/invoiceStatuses';
import { filterInvoices, searchInvoices } from '../utils/invoicePresentation';
import { useInvoiceCatalog } from '../utils/invoiceCatalog';

export function InvoicesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const [filter, setFilter] = useState(INVOICE_FILTER.ALL);
  const [query, setQuery] = useState('');
  const catalog = useInvoiceCatalog();
  const invoices = useMemo(() => {
    const filtered = filterInvoices(catalog, filter);
    return searchInvoices(filtered, query);
  }, [catalog, filter, query]);
  const startNewInvoice = useCallback(() => {
    navigation.navigate(ROUTES.CREATE_INVOICE, { source: CREATE_INVOICE_SOURCE.INVOICES });
  }, [navigation]);
  const openInvoice = useCallback(
    (invoice) => {
      navigation.navigate(ROUTES.INVOICE_DETAIL, { invoiceId: invoice.id });
    },
    [navigation],
  );
  const emptyLabel = query.trim() ? 'No invoices match that search.' : 'No invoices in this view.';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
          position: 'relative',
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
        controls: {
          gap: 16,
        },
      }),
    [colors, tabBarHeight],
  );

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.controls}>
          <InvoiceSearchBar value={query} onChangeText={setQuery} />
          <FilterPills
            options={INVOICE_FILTER_OPTIONS}
            selectedKey={filter}
            size="large"
            onSelect={setFilter}
          />
        </View>
        <InvoiceList emptyLabel={emptyLabel} invoices={invoices} onInvoicePress={openInvoice} />
      </ScrollView>
      <AddInvoiceFab onPress={startNewInvoice} />
    </View>
  );
}
