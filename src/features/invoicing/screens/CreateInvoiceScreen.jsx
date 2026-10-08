import { useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  HeaderBarSideSlot,
  HeaderTextButton,
  WizardStepTitle,
  androidBalancedHeaderLeft,
  androidHeaderTitleBalanceRight,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { getSession } from '../../auth';
import { deleteInvoice } from '../api/invoiceWrites';
import { CreateInvoiceForm } from '../components/create-invoice/CreateInvoiceForm';
import { InvoiceHeaderDeleteButton } from '../components/InvoiceHeaderDeleteButton';
import { InvoiceHoldStage } from '../components/InvoiceHoldStage';
import { INVOICE_SEND_MIN_PENDING_MS } from '../components/InvoiceSendSubmittingState';
import { CREATE_INVOICE_STEPS } from '../constants/createInvoiceWizard';
import { INVOICES_QUERY_ROOT } from '../queryKeys';
import { useLeaveWhenInvoicesHidden } from '../hooks/useLeaveWhenInvoicesHidden';
import { confirmDeleteInvoice } from '../utils/confirmDeleteInvoice';
import {
  canContinueInvoiceStep,
  canCreateInvoice,
  seedCreateInvoiceDraft,
} from '../utils/createInvoiceDraft';

const LAST_STEP = CREATE_INVOICE_STEPS.length - 1;

export function CreateInvoiceScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const invoiceAccess = useLeaveWhenInvoicesHidden();
  const scrollRef = useRef(null);
  const [deletePhase, setDeletePhase] = useState(
    /** @type {'idle' | 'pending' | 'error'} */ ('idle'),
  );
  const [deleteError, setDeleteError] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState(() => seedCreateInvoiceDraft(route.params ?? {}));
  const [savedInvoiceId, setSavedInvoiceId] = useState(() => {
    const id = route.params?.invoiceId ?? route.params?.savedInvoiceId ?? null;
    return id ? String(id) : null;
  });
  const step = CREATE_INVOICE_STEPS[stepIndex];
  const canContinue = canContinueInvoiceStep(step.id, draft);

  const cancelInvoice = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    const id = route.params?.savedInvoiceId;
    if (id) setSavedInvoiceId(String(id));
  }, [route.params?.savedInvoiceId]);

  const patchDraft = useCallback((patch) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const goBack = useCallback(() => {
    if (stepIndex === 0) {
      navigation.goBack();
      return;
    }
    setStepIndex((current) => current - 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [navigation, stepIndex]);

  const runDelete = useCallback(async () => {
    if (!savedInvoiceId || deletePhase === 'pending') return;
    setDeleteError('');
    setDeletePhase('pending');
    const pendingMin = new Promise((resolve) => {
      setTimeout(resolve, INVOICE_SEND_MIN_PENDING_MS);
    });
    try {
      const { data } = await getSession();
      const [result] = await Promise.all([
        deleteInvoice(data?.session?.access_token, savedInvoiceId),
        pendingMin,
      ]);
      if (!result.ok) {
        setDeleteError(
          safeUserFacingMessage(result.error, { fallback: 'Could not delete this invoice.' }),
        );
        setDeletePhase('error');
        return;
      }
      void queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_ROOT });
      navigation.navigate(ROUTES.MAIN_APP, {
        screen: ROUTES.MORE,
        params: { screen: ROUTES.INVOICES },
      });
    } catch (error) {
      setDeleteError(safeUserFacingMessage(error, { fallback: 'Could not delete this invoice.' }));
      setDeletePhase('error');
    }
  }, [deletePhase, navigation, queryClient, savedInvoiceId]);

  useLayoutEffect(() => {
    const deleting = deletePhase !== 'idle';
    navigation.setOptions({
      gestureEnabled: !deleting,
      headerShown: !deleting,
      title: 'New invoice',
      headerLeft: deleting
        ? undefined
        : androidBalancedHeaderLeft(() => (
            <HeaderTextButton
              accessibilityLabel="Cancel new invoice"
              label="Cancel"
              onPress={cancelInvoice}
            />
          )),
      headerRight: deleting
        ? undefined
        : savedInvoiceId
          ? () => {
              const button = (
                <InvoiceHeaderDeleteButton
                  onPress={() => {
                    confirmDeleteInvoice(() => {
                      void runDelete();
                    });
                  }}
                />
              );
              if (Platform.OS !== 'android') return button;
              return <HeaderBarSideSlot align="flex-end">{button}</HeaderBarSideSlot>;
            }
          : androidHeaderTitleBalanceRight(),
    });

    return () => {
      navigation.setOptions({ headerShown: true, headerLeft: undefined, headerRight: undefined });
    };
  }, [cancelInvoice, deletePhase, navigation, runDelete, savedInvoiceId]);

  const goForward = useCallback(() => {
    if (!canContinueInvoiceStep(step.id, draft)) return;
    if (stepIndex === LAST_STEP) {
      if (!canCreateInvoice(draft)) return;
      navigation.navigate(ROUTES.CREATE_INVOICE_PREVIEW, {
        draft,
        invoiceId: savedInvoiceId || undefined,
      });
      return;
    }
    setStepIndex((current) => current + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [draft, navigation, savedInvoiceId, step.id, stepIndex]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        flex: {
          flex: 1,
        },
        scroll: {
          flex: 1,
        },
        content: {
          flexGrow: 1,
          paddingBottom: 36,
          paddingHorizontal: SCREEN_GUTTER,
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
      }),
    [colors],
  );

  if (invoiceAccess.isReady && !invoiceAccess.canUseInvoices) {
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

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollRef}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={styles.content}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <WizardStepTitle
            stepCount={CREATE_INVOICE_STEPS.length}
            stepIndex={stepIndex}
            title={step.title}
          />
          <CreateInvoiceForm draft={draft} step={step.id} onChange={patchDraft} />
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: 12 + insets.bottom }]}>
          <View style={styles.footerBtn}>
            <Button
              fullWidth
              title={stepIndex === 0 ? 'Cancel' : 'Back'}
              variant="secondary"
              onPress={goBack}
            />
          </View>
          <View style={styles.footerBtn}>
            <Button
              disabled={!canContinue}
              fullWidth
              title={stepIndex === LAST_STEP ? 'Create invoice' : 'Continue'}
              variant="primary"
              onPress={goForward}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
