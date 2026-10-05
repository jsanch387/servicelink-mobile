import { useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { getSession } from '../../auth';
import { deleteInvoice } from '../api/invoiceWrites';
import { InvoiceActions } from '../components/InvoiceActions';
import { InvoiceHeaderDeleteButton } from '../components/InvoiceHeaderDeleteButton';
import { InvoiceDocument } from '../components/InvoiceDocument';
import { InvoiceDocumentSkeleton } from '../components/InvoiceDocumentSkeleton';
import { InvoiceDraftEditor } from '../components/InvoiceDraftEditor';
import { InvoiceDraftEditorSkeleton } from '../components/InvoiceDraftEditorSkeleton';
import { InvoiceHoldStage } from '../components/InvoiceHoldStage';
import { INVOICE_SEND_MIN_PENDING_MS } from '../components/InvoiceSendSubmittingState';
import { INVOICE_STATUS } from '../constants/invoiceStatuses';
import { useInvoiceOpen } from '../hooks/useInvoiceOpen';
import { INVOICES_QUERY_ROOT } from '../queryKeys';
import { confirmDeleteInvoice } from '../utils/confirmDeleteInvoice';

function InvoiceSheetStage({ children }) {
  const { colors } = useTheme();
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
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function InvoiceDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const opened = useInvoiceOpen(route.params?.invoiceId);
  const skipLeaveRef = useRef(false);
  const [voidPhase, setVoidPhase] = useState(/** @type {'idle' | 'pending' | 'error'} */ ('idle'));
  const [voidError, setVoidError] = useState('');
  const [deletePhase, setDeletePhase] = useState(
    /** @type {'idle' | 'pending' | 'error'} */ ('idle'),
  );
  const [deleteError, setDeleteError] = useState('');
  const onVoidState = useCallback((state) => {
    if (state.phase === 'pending') {
      setVoidError('');
      setVoidPhase('pending');
      return;
    }
    if (state.phase === 'error') {
      setVoidError(state.message || 'Could not update this invoice.');
      setVoidPhase('error');
      return;
    }
    setVoidError('');
    setVoidPhase('idle');
  }, []);
  const runDelete = useCallback(async () => {
    const id = String(
      opened.invoice?.id || opened.draft?.id || route.params?.invoiceId || '',
    ).trim();
    if (!id || deletePhase === 'pending') return;
    setDeleteError('');
    setDeletePhase('pending');
    const pendingMin = new Promise((resolve) => {
      setTimeout(resolve, INVOICE_SEND_MIN_PENDING_MS);
    });
    try {
      const { data } = await getSession();
      const [result] = await Promise.all([
        deleteInvoice(data?.session?.access_token, id),
        pendingMin,
      ]);
      if (!result.ok) {
        setDeleteError(
          safeUserFacingMessage(result.error, { fallback: 'Could not delete this invoice.' }),
        );
        setDeletePhase('error');
        return;
      }
      skipLeaveRef.current = true;
      navigation.navigate(ROUTES.INVOICES);
      void queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_ROOT });
    } catch (error) {
      setDeleteError(safeUserFacingMessage(error, { fallback: 'Could not delete this invoice.' }));
      setDeletePhase('error');
    }
  }, [
    deletePhase,
    navigation,
    opened.draft?.id,
    opened.invoice?.id,
    queryClient,
    route.params?.invoiceId,
  ]);
  const confirmDelete = useCallback(() => {
    if (deletePhase === 'pending' || voidPhase === 'pending') return;
    confirmDeleteInvoice(() => {
      void runDelete();
    });
  }, [deletePhase, runDelete, voidPhase]);
  const openingDraft =
    opened.outcome === 'draft' ||
    (opened.isLoading && route.params?.status === INVOICE_STATUS.DRAFT);

  const showHeaderDelete =
    (opened.outcome === 'draft' || opened.outcome === 'bill') &&
    deletePhase === 'idle' &&
    voidPhase === 'idle';

  useLayoutEffect(() => {
    navigation.setOptions({
      title: openingDraft ? 'Draft' : 'Invoice',
      headerRight: showHeaderDelete
        ? () => <InvoiceHeaderDeleteButton onPress={confirmDelete} />
        : undefined,
    });
  }, [confirmDelete, navigation, openingDraft, showHeaderDelete]);

  useEffect(() => {
    if (skipLeaveRef.current || !opened.shouldLeave) return undefined;
    const timeout = setTimeout(() => {
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate(ROUTES.INVOICES);
    }, 0);
    return () => clearTimeout(timeout);
  }, [navigation, opened.shouldLeave]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
      }),
    [colors],
  );

  if (voidPhase === 'pending' || voidPhase === 'error') {
    return (
      <InvoiceHoldStage
        errorAccessibilityLabel="Invoice could not be voided"
        errorMessage={voidPhase === 'error' ? voidError : ''}
        errorTitle="Couldn't void invoice"
        pendingLabel="Voiding invoice"
        onBack={() => onVoidState({ phase: 'done' })}
      />
    );
  }

  if (deletePhase === 'pending' || deletePhase === 'error') {
    return (
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
    );
  }

  if (opened.isLoading) {
    if (openingDraft) return <InvoiceDraftEditorSkeleton />;
    return (
      <InvoiceSheetStage>
        <InvoiceDocumentSkeleton />
      </InvoiceSheetStage>
    );
  }

  if (opened.shouldLeave || (opened.outcome !== 'bill' && opened.outcome !== 'draft')) {
    return <View style={styles.root} />;
  }

  if (opened.outcome === 'draft' && opened.draft) {
    return (
      <InvoiceDraftEditor
        draft={opened.draft}
        onClose={() => {
          if (navigation.canGoBack()) navigation.goBack();
          else navigation.navigate(ROUTES.INVOICES);
        }}
        onReview={(draft) => {
          navigation.navigate(ROUTES.CREATE_INVOICE_PREVIEW, {
            draft,
            invoiceId: route.params?.invoiceId,
            fromEditor: true,
          });
        }}
      />
    );
  }

  if (opened.outcome === 'bill' && opened.invoice) {
    const isSent = opened.invoice.status === INVOICE_STATUS.SENT;
    return (
      <InvoiceSheetStage>
        <InvoiceDocument businessName={opened.businessName} invoice={opened.invoice} />
        <InvoiceActions
          isSent={isSent}
          amountDue={Number(opened.invoice.amount) || 0}
          invoiceId={opened.invoice.id}
          shortCode={opened.invoice.shortCode}
          onVoidState={onVoidState}
        />
      </InvoiceSheetStage>
    );
  }

  return <View style={styles.root} />;
}
