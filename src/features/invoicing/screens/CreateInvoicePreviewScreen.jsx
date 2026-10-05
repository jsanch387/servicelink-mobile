import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppText,
  Button,
  HeaderBarSideSlot,
  HeaderTextButton,
  androidBalancedHeaderLeft,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  safeUserFacingMessage,
  showUserFacingErrorAlert,
} from '../../../utils/safeUserFacingMessage';
import { getSession } from '../../auth';
import { useAccountSettings } from '../../more/hooks/useAccountSettings';
import {
  deleteInvoice,
  patchInvoiceDraft,
  postInvoiceDraft,
  postSendInvoice,
} from '../api/invoiceWrites';
import { InvoiceDocument } from '../components/InvoiceDocument';
import { InvoiceHeaderDeleteButton } from '../components/InvoiceHeaderDeleteButton';
import { InvoiceHoldStage } from '../components/InvoiceHoldStage';
import {
  INVOICE_SEND_MIN_PENDING_MS,
  InvoiceSendSubmittingState,
} from '../components/InvoiceSendSubmittingState';
import { InvoiceSendSuccess } from '../components/InvoiceSendSuccess';
import { INVOICE_STATUS } from '../constants/invoiceStatuses';
import { INVOICES_QUERY_ROOT } from '../queryKeys';
import { buildInvoiceFromDraft } from '../utils/createInvoiceDraft';
import { describeInvoiceSendResult, invoiceSendConfirmationBody } from '../utils/invoiceSendResult';
import { confirmDeleteInvoice } from '../utils/confirmDeleteInvoice';
import { buildInvoiceWriteBody, invoiceUuidOrNull } from '../utils/invoiceWriteBody';
import { useLeaveWhenInvoicesHidden } from '../hooks/useLeaveWhenInvoicesHidden';

export function CreateInvoicePreviewScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { business } = useAccountSettings();
  const queryClient = useQueryClient();
  const invoiceAccess = useLeaveWhenInvoicesHidden();
  const draft = route.params?.draft ?? null;
  const [invoiceId, setInvoiceId] = useState(() => invoiceUuidOrNull(route.params?.invoiceId));

  useEffect(() => {
    const next = invoiceUuidOrNull(route.params?.invoiceId);
    if (next) setInvoiceId(next);
  }, [route.params?.invoiceId]);
  const [saving, setSaving] = useState(false);
  const [deletePhase, setDeletePhase] = useState(
    /** @type {'idle' | 'pending' | 'error'} */ ('idle'),
  );
  const [deleteError, setDeleteError] = useState('');
  const [phase, setPhase] = useState(
    /** @type {'review' | 'pending' | 'success' | 'error'} */ ('review'),
  );
  const [sendError, setSendError] = useState(null);
  const [confirmationBody, setConfirmationBody] = useState("We've sent the invoice.");
  const busy = saving || phase === 'pending' || deletePhase === 'pending';
  const hideNavigationHeader =
    phase === 'pending' || phase === 'success' || phase === 'error' || deletePhase !== 'idle';
  const businessName = business?.business_name?.trim() || 'Your business';
  const invoice = useMemo(() => {
    if (!draft) return null;
    return buildInvoiceFromDraft(
      draft,
      { id: invoiceId || 'preview', number: '' },
      INVOICE_STATUS.DRAFT,
    );
  }, [draft, invoiceId]);

  const editInvoice = useCallback(() => {
    if (route.params?.fromEditor || !invoiceId) {
      navigation.goBack();
      return;
    }
    navigation.navigate(ROUTES.CREATE_INVOICE, { savedInvoiceId: invoiceId });
  }, [invoiceId, navigation, route.params?.fromEditor]);

  const cancelInvoice = useCallback(() => {
    if (route.params?.fromEditor) {
      navigation.goBack();
      return;
    }
    navigation.pop(2);
  }, [navigation, route.params?.fromEditor]);

  const returnToInvoiceList = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_ROOT });
    navigation.navigate(ROUTES.MAIN_APP, {
      screen: ROUTES.MORE,
      params: { screen: ROUTES.INVOICES },
    });
  }, [navigation, queryClient]);

  const accessToken = useCallback(async () => {
    const { data } = await getSession();
    return data?.session?.access_token ?? '';
  }, []);

  const runDelete = useCallback(async () => {
    if (!invoiceId || deletePhase === 'pending') return;
    setDeleteError('');
    setDeletePhase('pending');
    const pendingMin = new Promise((resolve) => {
      setTimeout(resolve, INVOICE_SEND_MIN_PENDING_MS);
    });
    try {
      const token = await accessToken();
      const [result] = await Promise.all([deleteInvoice(token, invoiceId), pendingMin]);
      if (!result.ok) {
        setDeleteError(
          safeUserFacingMessage(result.error, { fallback: 'Could not delete this invoice.' }),
        );
        setDeletePhase('error');
        return;
      }
      returnToInvoiceList();
    } catch (error) {
      setDeleteError(safeUserFacingMessage(error, { fallback: 'Could not delete this invoice.' }));
      setDeletePhase('error');
    }
  }, [accessToken, deletePhase, invoiceId, returnToInvoiceList]);

  const saveDraft = useCallback(async () => {
    if (!draft || busy) return;
    setSaving(true);
    try {
      const token = await accessToken();
      const body = buildInvoiceWriteBody(draft);
      const result = invoiceId
        ? await patchInvoiceDraft(token, invoiceId, body)
        : await postInvoiceDraft(token, body);
      if (!result.ok) {
        showUserFacingErrorAlert('Could not save draft', result.error);
        return;
      }
      setInvoiceId(result.invoiceId);
      void queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_ROOT });
      Alert.alert('Draft saved', 'This invoice is saved. It has not been sent.');
    } finally {
      setSaving(false);
    }
  }, [accessToken, busy, draft, invoiceId, queryClient]);

  const sendInvoice = useCallback(async () => {
    if (!draft || saving || phase !== 'review') return;
    setSendError(null);
    setPhase('pending');
    const pendingMin = new Promise((resolve) => {
      setTimeout(resolve, INVOICE_SEND_MIN_PENDING_MS);
    });
    try {
      const token = await accessToken();
      const [result] = await Promise.all([
        postSendInvoice(token, buildInvoiceWriteBody(draft, { includeInvoiceId: true, invoiceId })),
        pendingMin,
      ]);
      if (!result.ok) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setSendError(
          safeUserFacingMessage(result.error, { fallback: 'Could not send this invoice.' }),
        );
        setPhase('error');
        return;
      }
      setInvoiceId(result.invoiceId);
      void queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_ROOT });
      const outcome = describeInvoiceSendResult(result);
      if (outcome.kind === 'failed') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setSendError(outcome.message);
        setPhase('error');
        return;
      }
      setConfirmationBody(
        invoiceSendConfirmationBody(result, { customerEmail: draft.customerEmail }),
      );
      setPhase('success');
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setSendError(safeUserFacingMessage(error, { fallback: 'Could not send this invoice.' }));
      setPhase('error');
    }
  }, [accessToken, draft, invoiceId, phase, queryClient, saving]);

  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: !hideNavigationHeader,
      headerShown: !hideNavigationHeader,
      title: 'Invoice',
      headerLeft: hideNavigationHeader
        ? undefined
        : androidBalancedHeaderLeft(() => (
            <HeaderTextButton
              accessibilityLabel="Cancel new invoice"
              label="Cancel"
              onPress={busy ? undefined : cancelInvoice}
            />
          )),
      headerRight: hideNavigationHeader
        ? undefined
        : () => {
            const save = (
              <HeaderTextButton
                accessibilityLabel="Save draft"
                label="Save"
                onPress={busy ? undefined : () => void saveDraft()}
              />
            );
            const row = (
              <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                {save}
                {invoiceId ? (
                  <InvoiceHeaderDeleteButton
                    onPress={() => {
                      if (busy) return;
                      confirmDeleteInvoice(() => {
                        void runDelete();
                      });
                    }}
                  />
                ) : null}
              </View>
            );
            if (Platform.OS !== 'android' || invoiceId) return row;
            return <HeaderBarSideSlot align="flex-end">{save}</HeaderBarSideSlot>;
          },
    });
  }, [busy, cancelInvoice, hideNavigationHeader, invoiceId, navigation, runDelete, saveDraft]);

  useLayoutEffect(
    () => () => {
      navigation.setOptions({
        gestureEnabled: true,
        headerShown: true,
        headerLeft: undefined,
        headerRight: undefined,
      });
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
          paddingBottom: 20,
          paddingHorizontal: 12,
          paddingTop: 12,
        },
        contentSuccess: {
          alignItems: 'center',
          flexGrow: 1,
          justifyContent: 'center',
          paddingBottom: 16,
          paddingHorizontal: 12,
        },
        footerStack: {
          backgroundColor: colors.shell,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        footer: {
          flexDirection: 'row',
          gap: 12,
        },
        footerDone: {
          flexDirection: 'column',
          gap: 0,
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
    [colors],
  );

  if (invoiceAccess.isReady && !invoiceAccess.canSeeInvoices) {
    return null;
  }

  if (deletePhase === 'pending' || deletePhase === 'error') {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.root}>
        <InvoiceHoldStage
          errorAccessibilityLabel="Invoice could not be deleted"
          errorMessage={deletePhase === 'error' ? deleteError : ''}
          errorTitle="Couldn't delete invoice"
          pendingLabel="Deleting invoice"
          onBack={() => {
            setDeleteError('');
            setDeletePhase('idle');
          }}
        />
      </SafeAreaView>
    );
  }

  if (phase === 'pending' || phase === 'error') {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.root}>
        <InvoiceSendSubmittingState
          active={phase === 'pending'}
          error={phase === 'error' ? sendError : null}
          onBackToReview={() => {
            setSendError(null);
            setPhase('review');
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={phase === 'success' ? styles.contentSuccess : styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {phase === 'success' ? (
          <InvoiceSendSuccess body={confirmationBody} />
        ) : invoice ? (
          <InvoiceDocument businessName={businessName} invoice={invoice} />
        ) : (
          <AppText style={styles.missing}>This invoice is not available.</AppText>
        )}
      </ScrollView>
      {phase === 'success' ? (
        <View
          style={[styles.footerStack, styles.footerDone, { paddingBottom: 12 + insets.bottom }]}
        >
          <Button fullWidth title="Done" variant="primary" onPress={returnToInvoiceList} />
        </View>
      ) : invoice ? (
        <View style={[styles.footerStack, { paddingBottom: 12 + insets.bottom }]}>
          <View style={styles.footer}>
            <View style={styles.footerBtn}>
              <Button
                disabled={busy}
                fullWidth
                title="Edit"
                variant="secondary"
                onPress={editInvoice}
              />
            </View>
            <View style={styles.footerBtn}>
              <Button
                disabled={busy}
                fullWidth
                iconName="paper-plane-outline"
                title="Send invoice"
                variant="primary"
                onPress={() => void sendInvoice()}
              />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
