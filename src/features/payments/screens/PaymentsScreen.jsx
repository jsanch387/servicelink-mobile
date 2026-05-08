import Ionicons from '@expo/vector-icons/Ionicons';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, InlineCardError, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import { createPaywallUpgradeCheckoutSession } from '../../subscription/api/createPaywallUpgradeCheckoutSession';
import { STRIPE_PAYWALL_CHECKOUT_AUTH_RETURN_URL } from '../../subscription/constants/stripePaywallCheckoutReturnUrl';
import { useSubscription } from '../../subscription';
import { PaymentAcceptServicelinkCard } from '../components/PaymentAcceptServicelinkCard';
import { PaymentsNonProUpsell } from '../components/PaymentsNonProUpsell';
import { PaymentsStripeConnectSetupCard } from '../components/PaymentsStripeConnectSetupCard';
import { PaymentDepositsSection } from '../components/PaymentDepositsSection';
import { PaymentHowCustomersPayCard } from '../components/PaymentHowCustomersPayCard';
import { PaymentStripeDashboardCard } from '../components/PaymentStripeDashboardCard';
import { DEPOSIT_AMOUNT_MODE } from '../constants/depositAmount';
import {
  CUSTOMER_PAYMENT_METHOD,
  CUSTOMER_PAYMENT_METHOD_OPTIONS,
} from '../constants/customerPaymentMethods';
import { postPaymentsServicelinkEnable } from '../api/postPaymentsServicelinkEnable';
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
  const [upgradeSubmitting, setUpgradeSubmitting] = useState(false);

  const onStripeConnectPress = useCallback(async () => {
    const token = session?.access_token ?? null;
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in again to continue.');
      return;
    }
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
      try {
        await WebBrowser.openAuthSessionAsync(
          created.url,
          STRIPE_CONNECT_ONBOARDING_AUTH_RETURN_URL,
        );
      } finally {
        await postStripeConnectSync(token).catch(() => {});
        await payment.refetchPayments();
        await refetchSubscription();
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
    const token = session?.access_token ?? null;
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in again to continue.');
      return;
    }
    setEnableSubmitting(true);
    try {
      const out = await postPaymentsServicelinkEnable(token);
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
  }, [payment, refetchSubscription, session?.access_token]);

  const onUpgradeToProPress = useCallback(async () => {
    const token = session?.access_token ?? null;
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in again to continue.');
      return;
    }
    setUpgradeSubmitting(true);
    try {
      const created = await createPaywallUpgradeCheckoutSession(token);
      if ('error' in created) {
        Alert.alert(
          'Could not start checkout',
          safeUserFacingMessage(created.error, { fallback: 'Something went wrong. Try again.' }),
        );
        return;
      }
      try {
        await WebBrowser.openAuthSessionAsync(created.url, STRIPE_PAYWALL_CHECKOUT_AUTH_RETURN_URL);
      } finally {
        await refetchSubscription();
      }
    } catch (e) {
      Alert.alert(
        'Checkout',
        safeUserFacingMessage(e, { fallback: 'Something went wrong. Try again.' }),
      );
    } finally {
      setUpgradeSubmitting(false);
    }
  }, [refetchSubscription, session?.access_token]);

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
          paddingHorizontal: 16,
          paddingTop: 16,
        },
        saveBar: {
          bottom: Math.max(insets.bottom - 12, 0),
          left: 16,
          position: 'absolute',
          right: 16,
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
    return (
      <View style={[styles.root, styles.boot]}>
        <ActivityIndicator
          accessibilityLabel="Loading subscription status"
          color={colors.accent}
          size="large"
        />
      </View>
    );
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
          <PaymentsNonProUpsell
            upgradeSubmitting={upgradeSubmitting}
            onUpgradePress={() => {
              void onUpgradeToProPress();
            }}
          />
        </ScrollView>
      </View>
    );
  }

  if (payment.isPendingPayments) {
    return (
      <View style={[styles.root, styles.boot]}>
        <ActivityIndicator
          accessibilityLabel="Loading payment settings"
          color={colors.accent}
          size="large"
        />
      </View>
    );
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

          <View
            pointerEvents={settingsLocked ? 'none' : 'auto'}
            style={[styles.cardsColumn, settingsLocked && styles.cardsColumnLocked]}
          >
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
