import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRoute } from '@react-navigation/native';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { useAccountSettings } from '../../more/hooks/useAccountSettings';
import { InvoiceActions } from '../components/InvoiceActions';
import { InvoiceDocument } from '../components/InvoiceDocument';
import { INVOICE_STATUS } from '../constants/invoiceStatuses';
import { getMockInvoice } from '../constants/mockInvoices';

export function InvoiceDetailScreen() {
  const { colors } = useTheme();
  const route = useRoute();
  const tabBarHeight = useBottomTabBarHeight();
  const { business } = useAccountSettings();
  const invoice = getMockInvoice(route.params?.invoiceId);
  const businessName = business?.business_name?.trim() || 'Your business';
  const isSent = invoice?.status === INVOICE_STATUS.SENT;

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
          paddingBottom: 20 + Math.max(tabBarHeight, 72),
          paddingHorizontal: 12,
          paddingTop: 12,
        },
        missing: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          lineHeight: 22,
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
        {invoice ? (
          <>
            <InvoiceDocument businessName={businessName} invoice={invoice} />
            <InvoiceActions isSent={isSent} />
          </>
        ) : (
          <AppText style={styles.missing}>This invoice is not available.</AppText>
        )}
      </ScrollView>
    </View>
  );
}
