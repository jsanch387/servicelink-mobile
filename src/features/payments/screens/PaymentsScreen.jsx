import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, InlineCardError, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import { useSubscription } from '../../subscription';
import { PaymentAcceptServicelinkCard } from '../components/PaymentAcceptServicelinkCard';
import { PaymentsScreenSkeleton } from '../components/PaymentsScreenSkeleton';
import { PaymentsNonProUpsell } from '../components/PaymentsNonProUpsell';
import { PaymentsStripeConnectSetupCard } from '../components/PaymentsStripeConnectSetupCard';
import { StripeConnectLaunchOverlay } from '../components/StripeConnectLaunchOverlay';
import { PaymentDepositsSection } from '../components/PaymentDepositsSection';
import { PaymentHowCustomersPayCard } from '../components/PaymentHowCustomersPayCard';
import { PaymentsTapToPaySection } from '../components/PaymentsTapToPaySection';
import { PaymentStripeDashboardCard } from '../components/PaymentStripeDashboardCard';
import { DEPOSIT_AMOUNT_MODE } from '../constants/depositAmount';
import {
  CUSTOMER_PAYMENT_METHOD,
  CUSTOMER_PAYMENT_METHOD_OPTIONS,
} from '../constants/customerPaymentMethods';
import { enableServicelinkPaymentsViaSupabase } from '../api/enableServicelinkPaymentsViaSupabase';
import { postStripeConnectOnboard } from '../api/postStripeConnectOnboard';
import { postStripeConnectSync } from '../api/postStripeConnectSync';
import { STRIPE_CONNECT_ONBOARDING_AUTH_RETURN_URL } from '../constants/stripeConnectReturnUrl';
import { usePaymentDashboardRead } from '../hooks/usePaymentDashboardRead';
import { useSavePaymentSettings } from '../hooks/useSavePaymentSettings';
import {
  safeUserFacingMessage,
  showUserFacingErrorAlert,
} from '../../../utils/safeUserFacingMessage';
import { getPaymentSaveUserMessage } from '../utils/paymentSaveUserMessage';
import {
  getStripeConnectSetupCopy,
  resolveStripeConnectSetupPresentation,
} from '../utils/stripeConnectSetupCopy';
import { isPositiveDepositAmount } from '../utils/depositAmountModel';

export function PaymentsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const {
    hasProAccess,
    isOwnerProfileLoaded,
    isLoading: subscriptionLoading,
    loadError: subscriptionLoadError,
    refetchSubscription,
  } = useSubscription();
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

  const [connectSubmitting, setConnectSubmitting] = useState(false);
  const [enableSubmitting, setEnableSubmitting] = useState(false);
  const [tapToPayEnablePromptSignal, setTapToPayEnablePromptSignal] = useState(0);

  const onStripeConnectPress = useCallback(async () => {
    const token = session?.access_token ?? null;
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in again to continue.');
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConnectSubmitting(true);
    try {
      const created = await postStripeConnectOnboard(token);
      if ('error' in created) {
        Alert.alert(
          'Could not open Stripe',
          safeUserFacingMessage(created.error, { fallback: 'Something went wrong. Try again.' }),
        );
        return;
      }
      const authResult = await WebBrowser.openAuthSessionAsync(
        created.url,
        STRIPE_CONNECT_ONBOARDING_AUTH_RETURN_URL,
      );
      /** Only sync after a completed redirect. Cancel/dismiss (e.g. iOS “use stripe.com” sheet) should leave UI unchanged. */
      if (authResult?.type === 'success') {
        await postStripeConnectSync(token).catch(() => {});
        await payment.refetchPayments();
        await refetchSubscription();
        setTapToPayEnablePromptSignal((n) => n + 1);
      }
    } catch (e) {
      Alert.alert(
        'Stripe',
        safeUserFacingMessage(e, { fallback: 'Something went wrong. Try again.' }),
      );
    } finally {
      setConnectSubmitting(false);
    }
  }, [payment, refetchSubscription, session?.access_token]);

  const onServicelinkEnablePress = useCallback(async () => {
    const bid = payment.business?.id ?? null;
    const paymentAccountId = payment.paymentAccount?.id ?? null;
    if (!bid || !paymentAccountId) {
      Alert.alert(
        'Turn on payments',
        'Your business or Stripe account is not ready yet. Try again in a moment.',
      );
      return;
    }
    setEnableSubmitting(true);
    try {
      const out = await enableServicelinkPaymentsViaSupabase({
        businessId: bid,
        paymentAccountId,
      });
      if ('error' in out) {
        const msg = safeUserFacingMessage(out.error, {
          fallback: 'Could not turn on payments. Try again.',
        });
        Alert.alert('Turn on payments', msg);
        return;
      }
      await payment.refetchPayments();
      await refetchSubscription();
    } catch (e) {
      Alert.alert(
        'Turn on payments',
        safeUserFacingMessage(e, { fallback: 'Something went wrong. Try again.' }),
      );
    } finally {
      setEnableSubmitting(false);
    }
  }, [payment, refetchSubscription]);

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
    const depositAmountOk = isPositiveDepositAmount(h.depositMode, h.depositAmount);
    const appliedRequireDeposits = Boolean(h.requireDeposits && depositAmountOk);
    setRequireDeposits(appliedRequireDeposits);
    setDepositAmount(h.depositAmount);
    setDepositMode(h.depositMode);
    setSavedDeposits({
      requireDeposits: appliedRequireDeposits,
      depositAmount: h.depositAmount.trim(),
      depositMode: h.depositMode,
    });
  }, [payment.business?.id, payment.formHydration, payment.paymentsQuerySuccess]);

  useEffect(() => {
    if (requireDeposits && depositAmount.trim() === '') {
      setRequireDeposits(false);
    }
  }, [depositAmount, requireDeposits]);

  const handleRequireDepositsChange = useCallback(
    (next) => {
      if (next && !isPositiveDepositAmount(depositMode, depositAmount)) {
        Alert.alert(
          'Deposits',
          'Enter a deposit amount greater than zero before requiring deposits.',
        );
        return;
      }
      setRequireDeposits(next);
    },
    [depositAmount, depositMode],
  );

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
  const depositsSaveValid = !requireDeposits || isPositiveDepositAmount(depositMode, depositAmount);
  const saveDisabled = !hasChanges || !canPersist || isSaving || !depositsSaveValid;

  const handleSaveAll = useCallback(async () => {
    if (!businessId || !canPersist) return;
    if (requireDeposits && !isPositiveDepositAmount(depositMode, depositAmount)) {
      Alert.alert('Deposits', 'Enter a deposit amount greater than zero to save.');
      return;
    }
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
          paddingHorizontal: 16,
          paddingTop: 16,
        },
        saveBar: {
          bottom: Math.max(insets.bottom - 12, 0),
          left: 16,
          position: 'absolute',
          right: 16,
        },
        gateCard: {
          gap: 8,
        },
        connectedRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
          paddingHorizontal: 2,
          paddingVertical: 2,
        },
        connectedTitle: {
          color: colors.text,
          flex: 1,
          fontSize: 13,
          fontWeight: '700',
          lineHeight: 18,
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
        /** Checkout + deposits muted when gate is on or ServiceLink checkout is off. */
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
    return <PaymentsScreenSkeleton accessibilityLabel="Loading" />;
  }

  if (payment.businessError) {
    return (
      <View style={[styles.root, { paddingHorizontal: 16, paddingTop: 16 }]}>
        <InlineCardError message={payment.businessError} />
      </View>
    );
  }

  if (!payment.business?.id) {
    return (
      <View style={[styles.root, { paddingHorizontal: 16, paddingTop: 16 }]}>
        <SurfaceCard>
          <AppText style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>
            Add a business profile to manage payments.
          </AppText>
        </SurfaceCard>
      </View>
    );
  }

  const verifyingSubscription = Boolean(user?.id) && subscriptionLoading && !isOwnerProfileLoaded;
  if (verifyingSubscription) {
    return <PaymentsScreenSkeleton accessibilityLabel="Loading subscription status" />;
  }

  const subscriptionVerifyFailed =
    Boolean(user?.id) && Boolean(subscriptionLoadError) && !isOwnerProfileLoaded;
  if (subscriptionVerifyFailed) {
    return (
      <View style={[styles.root, { gap: 16, paddingHorizontal: 16, paddingTop: 16 }]}>
        <SurfaceCard>
          <InlineCardError message={subscriptionLoadError ?? 'Could not verify subscription'} />
        </SurfaceCard>
        <Button
          title="Try again"
          variant="secondary"
          onPress={() => {
            void refetchSubscription();
          }}
        />
      </View>
    );
  }

  if (!hasProAccess) {
    const upsellBottomPad = Math.max(insets.bottom, 24) + 48;
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: upsellBottomPad }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <PaymentsNonProUpsell />
        </ScrollView>
      </View>
    );
  }

  if (payment.isPendingPayments) {
    return <PaymentsScreenSkeleton accessibilityLabel="Loading payment settings" />;
  }

  if (payment.paymentLoadError) {
    return (
      <View style={[styles.root, { gap: 16, paddingHorizontal: 16, paddingTop: 16 }]}>
        <SurfaceCard>
          <InlineCardError message={payment.paymentLoadError} />
        </SurfaceCard>
        <Button
          title="Try again"
          variant="secondary"
          onPress={() => {
            void payment.refetchPayments();
          }}
        />
      </View>
    );
  }

  if (!payment.stripeConnectReady) {
    const copy = getStripeConnectSetupCopy(payment.paymentAccount);
    const pres = resolveStripeConnectSetupPresentation(payment.paymentAccount, copy);
    const connectBottomPad = Math.max(insets.bottom, 24) + 32;
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: connectBottomPad }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <PaymentsStripeConnectSetupCard
            buttonTitle={pres.buttonTitle}
            description={pres.description}
            loading={connectSubmitting}
            title={pres.title}
            onConnectPress={() => {
              void onStripeConnectPress();
            }}
          />
        </ScrollView>
        <StripeConnectLaunchOverlay visible={connectSubmitting} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {saveError ? (
          <SurfaceCard>
            <InlineCardError message={getPaymentSaveUserMessage(saveError)} />
          </SurfaceCard>
        ) : null}

        <View style={styles.loadedStack}>
          {payment.gateServicelinkCheckout ? (
            <View style={styles.connectedRow}>
              <Ionicons color="#22c55e" name="checkmark-circle" size={22} />
              <AppText style={styles.connectedTitle}>You are connected to Stripe.</AppText>
            </View>
          ) : null}

          {payment.gateServicelinkCheckout ? (
            <SurfaceCard outlined padding="sm" style={styles.gateCard}>
              <AppText style={styles.gateTitle}>Turn on ServiceLink payments</AppText>
              <AppText style={styles.gateBody}>
                Turn on payments to start accepting checkout payments in ServiceLink.
              </AppText>
              <Button
                fullWidth
                loading={enableSubmitting}
                title={enableSubmitting ? 'Enabling…' : 'Turn on payments'}
                variant="surfaceLight"
                onPress={() => {
                  void onServicelinkEnablePress();
                }}
              />
            </SurfaceCard>
          ) : null}

          <View style={styles.cardsColumn}>
            {!payment.gateServicelinkCheckout ? (
              <PaymentAcceptServicelinkCard
                value={acceptServicelinkPayments}
                onValueChange={setAcceptServicelinkPayments}
              />
            ) : null}
            {!payment.gateServicelinkCheckout ? (
              <PaymentStripeDashboardCard
                stripeAccountId={payment.paymentAccount?.stripe_account_id ?? null}
              />
            ) : null}
            <PaymentsTapToPaySection enablePromptSignal={tapToPayEnablePromptSignal} />
            <View
              pointerEvents={settingsLocked || !acceptServicelinkPayments ? 'none' : 'auto'}
              style={[
                styles.checkoutDepositsStack,
                (settingsLocked || !acceptServicelinkPayments) && styles.checkoutDepositsMuted,
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
                onRequireDepositsChange={handleRequireDepositsChange}
              />
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.saveBar}>
        <Button
          disabled={saveDisabled || settingsLocked}
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
