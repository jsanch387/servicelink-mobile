import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppText,
  Button,
  HeaderTextButton,
  androidBalancedHeaderLeft,
  androidHeaderTitleBalanceRight,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { useAccountSettings } from '../../more/hooks/useAccountSettings';
import { InvoiceDocument } from '../components/InvoiceDocument';
import { INVOICE_STATUS } from '../constants/invoiceStatuses';
import { buildInvoiceFromDraft } from '../utils/createInvoiceDraft';
import { addInvoice, peekNextInvoiceNumber } from '../utils/invoiceCatalog';

export function CreateInvoicePreviewScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { business } = useAccountSettings();
  const draft = route.params?.draft ?? null;
  const businessName = business?.business_name?.trim() || 'Your business';
  const invoice = useMemo(() => {
    if (!draft) return null;
    return buildInvoiceFromDraft(
      draft,
      { id: 'preview', number: peekNextInvoiceNumber() },
      INVOICE_STATUS.DRAFT,
    );
  }, [draft]);

  const editInvoice = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const cancelInvoice = useCallback(() => {
    navigation.pop(2);
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Invoice',
      headerLeft: androidBalancedHeaderLeft(() => (
        <HeaderTextButton
          accessibilityLabel="Cancel new invoice"
          label="Cancel"
          onPress={cancelInvoice}
        />
      )),
      headerRight: androidHeaderTitleBalanceRight(),
    });

    return () => {
      navigation.setOptions({ headerShown: true, headerLeft: undefined, headerRight: undefined });
    };
  }, [cancelInvoice, navigation]);

  const sendInvoice = useCallback(() => {
    if (!draft) return;
    addInvoice(draft, INVOICE_STATUS.SENT);
    navigation.pop(2);
  }, [draft, navigation]);

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
          paddingBottom: 20,
          paddingHorizontal: 12,
          paddingTop: 12,
        },
        footer: {
          backgroundColor: colors.shell,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        footerBtn: {
          flex: 1,
          minWidth: 0,
        },
        missing: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          lineHeight: 22,
        },
      }),
    [colors, insets.bottom],
  );

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {invoice ? (
          <InvoiceDocument businessName={businessName} invoice={invoice} />
        ) : (
          <AppText style={styles.missing}>This invoice is not available.</AppText>
        )}
      </ScrollView>
      {invoice ? (
        <View style={[styles.footer, { paddingBottom: 12 + insets.bottom }]}>
          <View style={styles.footerBtn}>
            <Button fullWidth title="Edit" variant="secondary" onPress={editInvoice} />
          </View>
          <View style={styles.footerBtn}>
            <Button
              fullWidth
              iconName="paper-plane-outline"
              title="Send invoice"
              variant="primary"
              onPress={sendInvoice}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
