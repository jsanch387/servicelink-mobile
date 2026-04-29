import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, InlineCardError, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { PaymentAcceptServicelinkCard } from '../components/PaymentAcceptServicelinkCard';
import { PaymentDepositsSection } from '../components/PaymentDepositsSection';
import { PaymentHowCustomersPayCard } from '../components/PaymentHowCustomersPayCard';
import { PaymentStripeDashboardCard } from '../components/PaymentStripeDashboardCard';
import { DEPOSIT_AMOUNT_MODE } from '../constants/depositAmount';
import {
  CUSTOMER_PAYMENT_METHOD,
  CUSTOMER_PAYMENT_METHOD_OPTIONS,
} from '../constants/customerPaymentMethods';
import { usePaymentDashboardRead } from '../hooks/usePaymentDashboardRead';
import { useSavePaymentSettings } from '../hooks/useSavePaymentSettings';
import { showUserFacingErrorAlert } from '../../../utils/safeUserFacingMessage';
import { getPaymentSaveUserMessage } from '../utils/paymentSaveUserMessage';

export function PaymentsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const payment = usePaymentDashboardRead();
  const businessId = payment.business?.id ?? null;
  const { savePaymentSettings, isSaving, saveError } = useSavePaymentSettings({ businessId });

  const stickyBarHeight = 56;
  const scrollBottomPad = Math.max(insets.bottom, 16) + stickyBarHeight + 20;

  const [acceptServicelinkPayments, setAcceptServicelinkPayments] = useState(true);
  const [savedAcceptServicelinkPayments, setSavedAcceptServicelinkPayments] = useState(true);

  const [selectedMethodId, setSelectedMethodId] = useState(
    CUSTOMER_PAYMENT_METHOD.CUSTOMER_CHOOSES,
  );
  const [savedMethodId, setSavedMethodId] = useState(CUSTOMER_PAYMENT_METHOD.CUSTOMER_CHOOSES);

  const [requireDeposits, setRequireDeposits] = useState(true);
  const [depositAmount, setDepositAmount] = useState('50');
  const [depositMode, setDepositMode] = useState(DEPOSIT_AMOUNT_MODE.FIXED);
  const [savedDeposits, setSavedDeposits] = useState(() => ({
    requireDeposits: true,
    depositAmount: '50',
    depositMode: DEPOSIT_AMOUNT_MODE.FIXED,
  }));

  const appliedHydrationBusinessId = useRef(null);

  useEffect(() => {
    const bid = payment.business?.id;
    if (!bid) {
      appliedHydrationBusinessId.current = null;
      return;
    }
    if (!payment.paymentsQuerySuccess) return;
    if (appliedHydrationBusinessId.current === bid) return;
    appliedHydrationBusinessId.current = bid;
    const h = payment.formHydration;
    setAcceptServicelinkPayments(h.paymentsEnabled);
    setSavedAcceptServicelinkPayments(h.paymentsEnabled);
    setSelectedMethodId(h.selectedMethodId);
    setSavedMethodId(h.selectedMethodId);
    setRequireDeposits(h.requireDeposits);
    setDepositAmount(h.depositAmount);
    setDepositMode(h.depositMode);
    setSavedDeposits({
      requireDeposits: h.requireDeposits,
      depositAmount: h.depositAmount.trim(),
      depositMode: h.depositMode,
    });
  }, [payment.business?.id, payment.formHydration, payment.paymentsQuerySuccess]);

  const methodDirty = selectedMethodId !== savedMethodId;
  const acceptDirty = acceptServicelinkPayments !== savedAcceptServicelinkPayments;
  const depositsDirty = useMemo(() => {
    return (
      requireDeposits !== savedDeposits.requireDeposits ||
      depositAmount.trim() !== savedDeposits.depositAmount.trim() ||
      depositMode !== savedDeposits.depositMode
    );
  }, [depositAmount, depositMode, requireDeposits, savedDeposits]);

  const hasChanges = methodDirty || acceptDirty || depositsDirty;
  const canPersist = Boolean(payment.hasPaymentSettingsRow);
  const saveDisabled = !hasChanges || !canPersist || isSaving;

  const handleSaveAll = useCallback(async () => {
    if (!businessId || !canPersist) return;
    try {
      await savePaymentSettings({
        currency: payment.paymentSettings?.currency,
        paymentsEnabled: acceptServicelinkPayments,
        selectedMethodId,
        requireDeposits,
        depositAmount,
        depositMode,
      });
      setSavedMethodId(selectedMethodId);
      setSavedAcceptServicelinkPayments(acceptServicelinkPayments);
      setSavedDeposits({
        requireDeposits,
        depositAmount: depositAmount.trim(),
        depositMode,
      });
    } catch (e) {
      showUserFacingErrorAlert('Could not save', getPaymentSaveUserMessage(e));
    }
  }, [
    acceptServicelinkPayments,
    businessId,
    canPersist,
    depositAmount,
    depositMode,
    payment.paymentSettings?.currency,
    requireDeposits,
    savePaymentSettings,
    selectedMethodId,
  ]);

  const settingsLocked = payment.gateServicelinkCheckout;

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
          paddingBottom: scrollBottomPad,
          paddingHorizontal: 20,
          paddingTop: 16,
        },
        saveBar: {
          bottom: Math.max(insets.bottom - 12, 0),
          left: 20,
          position: 'absolute',
          right: 20,
        },
        boot: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
        },
        gateCard: {
          gap: 8,
        },
        gateTitle: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '700',
        },
        gateBody: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
        },
        /** Gate (optional) + card column — `gap` doesn’t cross fragment boundaries on the scroll content. */
        loadedStack: {
          alignSelf: 'stretch',
          gap: 16,
        },
        /** Space between payment cards (same 16 as scroll `content` gap). */
        cardsColumn: {
          alignSelf: 'stretch',
          gap: 16,
        },
        /** Gate: entire payments column (including Stripe) is de-emphasized. */
        cardsColumnLocked: {
          opacity: 0.5,
        },
        /** ServiceLink off: only checkout + deposits; accept + Stripe stay full opacity. */
        checkoutDepositsStack: {
          alignSelf: 'stretch',
          gap: 16,
        },
        checkoutDepositsMuted: {
          opacity: 0.4,
        },
      }),
    [colors.shell, colors.text, colors.textMuted, insets.bottom, scrollBottomPad],
  );

  if (payment.isPendingBusiness) {
    return (
      <View style={[styles.root, styles.boot]}>
        <ActivityIndicator accessibilityLabel="Loading" color={colors.accent} size="large" />
      </View>
    );
  }

  if (payment.businessError) {
    return (
      <View style={[styles.root, { paddingHorizontal: 20, paddingTop: 16 }]}>
        <InlineCardError message={payment.businessError} />
      </View>
    );
  }

  if (!payment.business?.id) {
    return (
      <View style={[styles.root, { paddingHorizontal: 20, paddingTop: 16 }]}>
        <SurfaceCard>
          <AppText style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>
            Add a business profile to manage payments.
          </AppText>
        </SurfaceCard>
      </View>
    );
  }

  const blockingPayments = payment.isPendingPayments;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {payment.paymentLoadError ? (
          <SurfaceCard>
            <InlineCardError message={payment.paymentLoadError} />
          </SurfaceCard>
        ) : null}

        {saveError ? (
          <SurfaceCard>
            <InlineCardError message={getPaymentSaveUserMessage(saveError)} />
          </SurfaceCard>
        ) : null}

        {blockingPayments ? (
          <View style={styles.boot}>
            <ActivityIndicator
              accessibilityLabel="Loading payment settings"
              color={colors.accent}
            />
          </View>
        ) : (
          <View style={styles.loadedStack}>
            {payment.gateServicelinkCheckout ? (
              <SurfaceCard outlined padding="sm" style={styles.gateCard}>
                <AppText style={styles.gateTitle}>Turn on ServiceLink checkout on the web</AppText>
                <AppText style={styles.gateBody}>
                  Stripe is connected, but there is no payment settings row yet. Finish enabling
                  ServiceLink payments in the web dashboard; then these controls will stay in sync
                  with your database.
                </AppText>
              </SurfaceCard>
            ) : null}

            <View
              pointerEvents={settingsLocked ? 'none' : 'auto'}
              style={[styles.cardsColumn, settingsLocked && styles.cardsColumnLocked]}
            >
              <PaymentAcceptServicelinkCard
                value={acceptServicelinkPayments}
                onValueChange={setAcceptServicelinkPayments}
              />
              <PaymentStripeDashboardCard
                stripeAccountId={payment.paymentAccount?.stripe_account_id ?? null}
              />
              <View
                pointerEvents={settingsLocked || !acceptServicelinkPayments ? 'none' : 'auto'}
                style={[
                  styles.checkoutDepositsStack,
                  !settingsLocked && !acceptServicelinkPayments && styles.checkoutDepositsMuted,
                ]}
                testID="payments-checkout-deposits-stack"
              >
                <PaymentHowCustomersPayCard
                  options={CUSTOMER_PAYMENT_METHOD_OPTIONS}
                  selectedId={selectedMethodId}
                  onSelectId={setSelectedMethodId}
                />
                <PaymentDepositsSection
                  depositAmount={depositAmount}
                  depositMode={depositMode}
                  requireDeposits={requireDeposits}
                  onDepositAmountChange={setDepositAmount}
                  onDepositModeChange={setDepositMode}
                  onRequireDepositsChange={setRequireDeposits}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      <View style={styles.saveBar}>
        <Button
          disabled={saveDisabled || settingsLocked || blockingPayments}
          fullWidth
          loading={isSaving}
          title={isSaving ? 'Saving…' : 'Save changes'}
          variant="surfaceLight"
          onPress={() => {
            void handleSaveAll();
          }}
        />
      </View>
    </View>
  );
}
