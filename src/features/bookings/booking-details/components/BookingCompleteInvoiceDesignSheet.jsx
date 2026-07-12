import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Vibration,
  View,
} from 'react-native';
import {
  AppText,
  BottomSheetOverlayProvider,
  Button,
  DetailsSectionCard,
  Divider,
  InlineCardError,
  LabelValueRow,
  ToastModalHost,
  useBottomSheetOverlay,
  useToast,
} from '../../../../components/ui';
import { useModalFadeBackdropSlideSheet } from '../../../../components/ui/useModalFadeBackdropSlideSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SUBMIT_OUTCOME_SUCCESS } from '../../../../components/ui/submitOutcomeTokens';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import {
  getCompleteVisitFollowUpInfo,
  getCompleteVisitPaidRowLabel,
  resolveCompleteVisitDesignMock,
} from '../constants/bookingCompleteInvoiceDesignMock';
import { getCompleteVisitPaymentSettledBanner } from '../constants/completeVisitNotificationCopy';
import { getCompleteVisitSuccessCopy } from '../constants/completeVisitSuccessCopy';
import {
  buildCompleteVisitCheckoutFromSheetState,
  canSubmitJobCompletedCheckout,
} from '../utils/buildJobCompletedPayload';
import { CompleteVisitPaymentSkeleton } from './CompleteVisitPaymentSkeleton';
import { CompleteVisitSubmitOverlay } from './CompleteVisitSubmitOverlay';
import { CompleteVisitAddFeeSheet } from './CompleteVisitAddFeeSheet';
import { CompleteVisitReceiptEmailDialog } from './CompleteVisitReceiptEmailDialog';
import { CompleteVisitReceiptEmailNotice } from './CompleteVisitReceiptEmailNotice';
import { updateBookingCustomerEmail } from '../api/updateBookingCustomerEmail';
import {
  COMPLETE_VISIT_RECEIPT_EMAIL_INVALID_TOAST,
  COMPLETE_VISIT_RECEIPT_EMAIL_SAVE_ERROR_TOAST,
} from '../constants/completeVisitReceiptEmailCopy';
import { bookingsDetailsQueryKey } from '../../queryKeys';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { isValidEmailFormat } from '../../../../utils/email';
import {
  TapToPaySheet,
  TAP_TO_PAY_RECEIPT_ROW_LABEL,
  buildTapToPaySessionFees,
  isTapToPayUiEnabled,
  TAP_TO_PAY_USE_TERMINAL_SDK,
  useTapToPayConnectReadiness,
  navigateToPaymentsSetup,
  TAP_TO_PAY_SETUP_ACCESSIBILITY_HINT,
  TAP_TO_PAY_COLLECT_ACCESSIBILITY_HINT,
  TAP_TO_PAY_CHECKOUT_BUTTON_LABEL,
} from '../../../tap-to-pay';
import { useTapToPayReaderPrewarm } from '../../../tap-to-pay/hooks/useTapToPayReaderPrewarm';
import { TapToPayCheckoutIcon } from '../../../tap-to-pay/components/TapToPayCheckoutIcon';
import { TapToPaySetupRequiredSheet } from '../../../tap-to-pay/components/TapToPaySetupRequiredSheet';
import { isTapToPayNativeRuntimeAvailable } from '../../../tap-to-pay/utils/isTapToPayNativeRuntimeAvailable';
import { useAuth } from '../../../auth';
import {
  CompleteVisitMarkPaidSheet,
  getInPersonPaymentRowLabel,
} from './CompleteVisitMarkPaidSheet';

function formatUsd(amount) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(safe);
}

/**
 * @param {{
 *   label: string;
 *   sublabel?: string | null;
 *   value: string;
 *   noTopMargin?: boolean;
 *   colors: import('../../../../theme').ThemeColors;
 * }} props
 */
function CompleteVisitBreakdownRow({ label, sublabel, value, noTopMargin = false, colors }) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: noTopMargin ? 0 : 8,
        },
        labelCol: {
          flex: 1,
          gap: 2,
          marginRight: 12,
          minWidth: 0,
        },
        label: {
          color: colors.textMuted,
          fontSize: 14,
        },
        sublabel: {
          color: colors.textSecondary,
          fontSize: 12,
          fontWeight: '500',
        },
        value: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '400',
          textAlign: 'right',
        },
      }),
    [colors, noTopMargin],
  );

  return (
    <View style={styles.row}>
      <View style={styles.labelCol}>
        <AppText style={styles.label}>{label}</AppText>
        {sublabel ? <AppText style={styles.sublabel}>{sublabel}</AppText> : null}
      </View>
      <AppText style={styles.value}>{value}</AppText>
    </View>
  );
}

/**
 * @param {{
 *   adjustments: Array<{ id: string; label: string; amount: number }>;
 *   onAddFee: (fee: { label: string; amount: number }) => void;
 *   onRemoveFee: (id: string) => void;
 *   onTapToPaySuccess: (result: { amountCents: number; paymentIntentId: string | null }) => void | Promise<void>;
 *   tapToPayAmount: number;
 *   bookingId?: string | null;
 *   accessToken?: string | null;
 *   showTapToPay?: boolean;
 *   merchantDisplayName?: string | null;
 *   tapToPayPrewarmConnectParams?: { terminalLocationId: string; stripeAccountId: string } | null;
 *   tapToPayConnectReady?: boolean;
 *   tapToPayConnectLoading?: boolean;
 *   onTapToPaySetupPress?: () => void;
 *   onMarkPaidInPerson: (method: string, amount: number) => void;
 *   amountDue: number;
 *   subtotal: number;
 *   paidOnline: number;
 *   inPersonPayment: { method: string; amount: number } | null;
 *   onlinePaidRowLabel: string | null;
 *   showCollectActions: boolean;
 *   followUpInfo: { visible: boolean; message: string; iconName: string };
 *   iosKeyboardScrollPadding: number;
 *   lineItems: Array<{ id: string; label: string; sublabel?: string | null; amount: number }>;
 *   savedReceiptEmail: string;
 *   onPressAddReceiptEmail: () => void;
 *   showReceiptEmailNotice?: boolean;
 * }} props
 */
function CompleteVisitDesignBody({
  adjustments,
  onAddFee,
  onRemoveFee,
  onTapToPaySuccess,
  tapToPayAmount,
  bookingId = null,
  accessToken = null,
  showTapToPay = false,
  merchantDisplayName = null,
  tapToPayPrewarmConnectParams = null,
  tapToPayConnectReady = false,
  tapToPayConnectLoading = false,
  onTapToPaySetupPress,
  amountDue,
  subtotal,
  paidOnline,
  inPersonPayment,
  onlinePaidRowLabel,
  showCollectActions,
  followUpInfo,
  iosKeyboardScrollPadding,
  onMarkPaidInPerson,
  lineItems,
  savedReceiptEmail,
  onPressAddReceiptEmail,
  showReceiptEmailNotice = false,
}) {
  const { colors } = useTheme();
  const overlay = useBottomSheetOverlay();
  const [setupSheetVisible, setSetupSheetVisible] = useState(false);

  useEffect(() => () => overlay?.hide(), [overlay]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scrollContent: {
          gap: 16,
          paddingHorizontal: 16,
          paddingTop: 24,
        },
        breakdownRows: {
          gap: 2,
        },
        breakdownTotalDivider: {
          marginBottom: 4,
          marginTop: 14,
        },
        adjustmentRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'space-between',
          marginTop: 8,
        },
        adjustmentLabelWrap: {
          alignItems: 'center',
          flex: 1,
          flexDirection: 'row',
          gap: 6,
          minWidth: 0,
        },
        adjustmentLabel: {
          color: colors.textSecondary,
          flex: 1,
          fontSize: 14,
          fontWeight: '500',
          minWidth: 0,
        },
        adjustmentAmount: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
        },
        removeBtn: {
          alignItems: 'center',
          height: 28,
          justifyContent: 'center',
          width: 28,
        },
        totalRow: {
          alignItems: 'baseline',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 2,
        },
        totalLabel: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
        },
        totalValue: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 26,
          fontWeight: '700',
          letterSpacing: -0.45,
        },
        paymentActions: {
          gap: 10,
          marginTop: 16,
        },
        paidBanner: {
          alignItems: 'center',
          backgroundColor: SUBMIT_OUTCOME_SUCCESS.ring,
          borderRadius: 12,
          flexDirection: 'row',
          gap: 12,
          marginBottom: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        paidBannerTextWrap: {
          flex: 1,
          gap: 2,
          minWidth: 0,
        },
        paidBannerTitle: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '700',
          letterSpacing: -0.15,
        },
        paidBannerDetail: {
          color: colors.textSecondary,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
        },
        followUpRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 6,
          marginTop: 6,
        },
        followUpIcon: {
          marginTop: 0,
          opacity: 0.85,
        },
        followUpText: {
          color: colors.placeholder,
          flex: 1,
          fontSize: 12,
          fontWeight: '400',
          lineHeight: 16,
          minWidth: 0,
        },
      }),
    [colors],
  );

  const openAddFeeSheet = () => {
    Keyboard.dismiss();
    overlay?.show(<CompleteVisitAddFeeSheet onAdd={onAddFee} onClose={() => overlay.hide()} />);
  };

  const openTapToPaySheet = useCallback(() => {
    Keyboard.dismiss();
    const sessionFees = buildTapToPaySessionFees(adjustments);
    overlay?.show(
      <TapToPaySheet
        accessToken={accessToken}
        amountDue={amountDue}
        bookingId={bookingId}
        merchantDisplayName={merchantDisplayName}
        prewarmConnectParams={tapToPayPrewarmConnectParams}
        sessionFees={sessionFees}
        onClose={() => overlay.hide()}
        onSuccess={onTapToPaySuccess}
      />,
    );
  }, [
    accessToken,
    adjustments,
    amountDue,
    bookingId,
    merchantDisplayName,
    onTapToPaySuccess,
    overlay,
    tapToPayPrewarmConnectParams,
  ]);

  const canUseTapToPay = tapToPayConnectReady && !tapToPayConnectLoading;
  const hasReceiptEmailForTapToPay = isValidEmailFormat(savedReceiptEmail);
  const tapToPayNeedsReceiptEmail = showReceiptEmailNotice && !hasReceiptEmailForTapToPay;

  const handleTapToPayPress = useCallback(() => {
    if (tapToPayConnectLoading || tapToPayNeedsReceiptEmail) {
      return;
    }
    if (!isTapToPayNativeRuntimeAvailable()) {
      Alert.alert(
        'Development build required',
        'Tap to Pay needs a development build with Stripe Terminal. It is not available in Expo Go.',
      );
      return;
    }
    if (canUseTapToPay) {
      openTapToPaySheet();
      return;
    }
    setSetupSheetVisible(true);
  }, [canUseTapToPay, openTapToPaySheet, tapToPayConnectLoading, tapToPayNeedsReceiptEmail]);

  const handleSetupPaymentsPress = useCallback(() => {
    setSetupSheetVisible(false);
    onTapToPaySetupPress?.();
  }, [onTapToPaySetupPress]);

  const openMarkPaidSheet = () => {
    Keyboard.dismiss();
    overlay?.show(
      <CompleteVisitMarkPaidSheet
        amountDue={amountDue}
        onClose={() => overlay.hide()}
        onConfirm={(method) => onMarkPaidInPerson(method, amountDue)}
      />,
    );
  };

  const hasAppliedPayments =
    Boolean(onlinePaidRowLabel) || tapToPayAmount > 0 || Boolean(inPersonPayment);
  const showAmountDueHero = !hasAppliedPayments && amountDue > 0;
  const isPaymentSettled = amountDue <= 0;
  const canEditFees = !isPaymentSettled;

  const paymentSettledBanner = useMemo(() => {
    if (!isPaymentSettled) {
      return null;
    }
    return getCompleteVisitPaymentSettledBanner({
      paidOnline,
      subtotal,
      tapToPayAmount,
      inPersonPayment,
    });
  }, [inPersonPayment, isPaymentSettled, paidOnline, subtotal, tapToPayAmount]);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: 24 + iosKeyboardScrollPadding },
      ]}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <DetailsSectionCard bodyPadding="roomy" title="Payment">
        {paymentSettledBanner ? (
          <View style={styles.paidBanner}>
            <Ionicons color={SUBMIT_OUTCOME_SUCCESS.color} name="checkmark-circle" size={28} />
            <View style={styles.paidBannerTextWrap}>
              <AppText style={styles.paidBannerTitle}>{paymentSettledBanner.title}</AppText>
              <AppText style={styles.paidBannerDetail}>{paymentSettledBanner.detail}</AppText>
            </View>
          </View>
        ) : null}
        {showAmountDueHero ? (
          <View style={styles.totalRow}>
            <AppText style={styles.totalLabel}>Amount due</AppText>
            <AppText style={styles.totalValue}>{formatUsd(amountDue)}</AppText>
          </View>
        ) : (
          <>
            <LabelValueRow emphasize noTopMargin label="Total" value={formatUsd(subtotal)} />
            {onlinePaidRowLabel ? (
              <LabelValueRow label={onlinePaidRowLabel} value={`−${formatUsd(paidOnline)}`} />
            ) : null}
            {tapToPayAmount > 0 ? (
              <LabelValueRow
                label={TAP_TO_PAY_RECEIPT_ROW_LABEL}
                value={`−${formatUsd(tapToPayAmount)}`}
              />
            ) : null}
            {inPersonPayment ? (
              <LabelValueRow
                label={getInPersonPaymentRowLabel(inPersonPayment.method)}
                value={`−${formatUsd(inPersonPayment.amount)}`}
              />
            ) : null}
            {amountDue > 0 ? (
              <LabelValueRow emphasize label="Amount due" value={formatUsd(amountDue)} />
            ) : null}
          </>
        )}
        {showCollectActions ? (
          <View style={styles.paymentActions}>
            {showTapToPay ? (
              <Button
                accessibilityHint={
                  tapToPayNeedsReceiptEmail
                    ? 'Add a customer email below to use Tap to Pay'
                    : canUseTapToPay
                      ? TAP_TO_PAY_COLLECT_ACCESSIBILITY_HINT
                      : TAP_TO_PAY_SETUP_ACCESSIBILITY_HINT
                }
                disabled={tapToPayConnectLoading || tapToPayNeedsReceiptEmail}
                fullWidth
                iconNode={<TapToPayCheckoutIcon size={22} />}
                loading={tapToPayConnectLoading}
                title={TAP_TO_PAY_CHECKOUT_BUTTON_LABEL}
                variant="surfaceLight"
                onPress={handleTapToPayPress}
              />
            ) : null}
            <Button
              fullWidth
              iconName="checkmark-circle-outline"
              title="Mark as paid"
              variant="secondary"
              onPress={openMarkPaidSheet}
            />
          </View>
        ) : null}
      </DetailsSectionCard>

      {showReceiptEmailNotice ? (
        <CompleteVisitReceiptEmailNotice onPressAddEmail={onPressAddReceiptEmail} />
      ) : null}

      <DetailsSectionCard bodyPadding="roomy" title="Breakdown">
        <View style={styles.breakdownRows}>
          {lineItems.map((item, index) => {
            const amountLabel =
              item.amount < 0 ? `−${formatUsd(Math.abs(item.amount))}` : formatUsd(item.amount);
            return item.sublabel ? (
              <CompleteVisitBreakdownRow
                key={item.id}
                colors={colors}
                label={item.label}
                noTopMargin={index === 0}
                sublabel={item.sublabel}
                value={amountLabel}
              />
            ) : (
              <LabelValueRow
                key={item.id}
                label={item.label}
                noTopMargin={index === 0}
                value={amountLabel}
              />
            );
          })}

          {adjustments.map((item) => (
            <View key={item.id} style={styles.adjustmentRow}>
              {canEditFees ? (
                <View style={styles.adjustmentLabelWrap}>
                  <Pressable
                    accessibilityLabel={`Remove ${item.label}`}
                    accessibilityRole="button"
                    hitSlop={8}
                    style={styles.removeBtn}
                    onPress={() => onRemoveFee(item.id)}
                  >
                    <Ionicons color={colors.danger} name="close-circle" size={18} />
                  </Pressable>
                  <AppText ellipsizeMode="tail" numberOfLines={2} style={styles.adjustmentLabel}>
                    {item.label}
                  </AppText>
                </View>
              ) : (
                <AppText ellipsizeMode="tail" numberOfLines={2} style={styles.adjustmentLabel}>
                  {item.label}
                </AppText>
              )}
              <AppText style={styles.adjustmentAmount}>{formatUsd(item.amount)}</AppText>
            </View>
          ))}

          <View style={styles.breakdownTotalDivider}>
            <Divider />
          </View>
          <LabelValueRow emphasize label="Total" noTopMargin value={formatUsd(subtotal)} />
        </View>
      </DetailsSectionCard>

      {canEditFees ? (
        <Button
          fullWidth
          iconName="add-circle-outline"
          title="Add fee"
          variant="secondary"
          onPress={openAddFeeSheet}
        />
      ) : null}

      {followUpInfo.visible ? (
        <View style={styles.followUpRow}>
          <Ionicons
            color={colors.placeholder}
            name={followUpInfo.iconName}
            size={14}
            style={styles.followUpIcon}
          />
          <AppText style={styles.followUpText}>{followUpInfo.message}</AppText>
        </View>
      ) : null}

      <TapToPaySetupRequiredSheet
        visible={setupSheetVisible}
        onRequestClose={() => setSetupSheetVisible(false)}
        onSetupPress={handleSetupPaymentsPress}
      />
    </ScrollView>
  );
}

/**
 * Full-screen complete visit flow — receipt, add fee, tap to pay, mark paid.
 *
 * @param {{
 *   visible: boolean;
 *   onRequestClose: () => void;
 *   visitModel?: import('../utils/buildCompleteVisitModel').CompleteVisitModel | null;
 *   isLoading?: boolean;
 *   loadError?: string | null;
 *   onComplete?: (
 *     checkout: import('../utils/buildJobCompletedPayload').CompleteVisitCheckoutState,
 *   ) => void | Promise<void>;
 *   bookingId?: string | null;
 * }} props
 */
export function BookingCompleteVisitSheet({
  visible,
  onRequestClose,
  visitModel = null,
  isLoading = false,
  loadError = null,
  onComplete,
  bookingId = null,
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const toast = useToast();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token ?? null;
  const {
    isConnectReady: tapToPayConnectReady,
    isLoading: tapToPayConnectLoading,
    merchantDisplayName,
    terminalLocationId,
    stripeAccountId,
    refetch: refetchTapToPayConnectReadiness,
  } = useTapToPayConnectReadiness();
  const showTapToPay = isTapToPayUiEnabled();
  const isDesignPreview = !visitModel && !isLoading && !loadError;
  const resolvedModel = visitModel ?? (isDesignPreview ? resolveCompleteVisitDesignMock() : null);

  const { prepareOpen, runOpen, runClose, backdropStyle, sheetStyle } =
    useModalFadeBackdropSlideSheet();
  const [mounted, setMounted] = useState(visible);
  const [iosKeyboardScrollPadding, setIosKeyboardScrollPadding] = useState(0);

  const [adjustments, setAdjustments] = useState(
    /** @type {Array<{ id: string; label: string; amount: number }>} */ ([]),
  );
  const [tapToPayAmount, setTapToPayAmount] = useState(0);
  const [inPersonPayment, setInPersonPayment] = useState(
    /** @type {{ method: string; amount: number } | null} */ (null),
  );
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState(
    /** @type {string | null} */ (null),
  );
  const [submitPhase, setSubmitPhase] = useState(
    /** @type {'idle' | 'pending' | 'success'} */ ('idle'),
  );
  const [receiptEmailDraft, setReceiptEmailDraft] = useState('');
  const [savedReceiptEmail, setSavedReceiptEmail] = useState('');
  const [receiptEmailDialogVisible, setReceiptEmailDialogVisible] = useState(false);
  const completeTimeoutRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

  const MOCK_COMPLETE_MS = 2400;

  useEffect(() => {
    if (visible) {
      void refetchTapToPayConnectReadiness();
    }
  }, [refetchTapToPayConnectReadiness, visible]);

  useEffect(() => {
    if (visible) {
      prepareOpen();
      setMounted(true);
    }
  }, [visible, prepareOpen]);

  useEffect(() => {
    if (!mounted) {
      return undefined;
    }
    if (visible) {
      const id = requestAnimationFrame(() => runOpen());
      return () => cancelAnimationFrame(id);
    }
    runClose(() => setMounted(false));
    return undefined;
  }, [mounted, visible, runOpen, runClose]);

  useEffect(() => {
    if (!visible) {
      setIosKeyboardScrollPadding(0);
      setAdjustments([]);
      setTapToPayAmount(0);
      setInPersonPayment(null);
      setStripePaymentIntentId(null);
      setSubmitPhase('idle');
      setReceiptEmailDraft('');
      setSavedReceiptEmail('');
      setReceiptEmailDialogVisible(false);
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = null;
      }
    }
  }, [visible]);

  useEffect(
    () => () => {
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return undefined;
    }
    const onShow = (e) => {
      setIosKeyboardScrollPadding(Math.max(0, e?.endCoordinates?.height ?? 0));
    };
    const onHide = () => setIosKeyboardScrollPadding(0);
    const subShow = Keyboard.addListener('keyboardWillShow', onShow);
    const subHide = Keyboard.addListener('keyboardWillHide', onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible || !resolvedModel) {
      return;
    }
    const email = String(resolvedModel.customerEmail ?? '').trim();
    setSavedReceiptEmail(email);
    setReceiptEmailDraft(email);
  }, [resolvedModel, visible]);

  const subtotal = useMemo(() => {
    if (!resolvedModel) {
      return 0;
    }
    const base = resolvedModel.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const adj = adjustments.reduce((sum, item) => sum + item.amount, 0);
    return base + adj;
  }, [adjustments, resolvedModel]);

  const paidOnline = resolvedModel?.paidOnline ?? 0;
  const inPersonPaid = inPersonPayment?.amount ?? 0;
  const amountDue = Math.max(0, subtotal - paidOnline - tapToPayAmount - inPersonPaid);

  const isPaidInFullOnline =
    Boolean(resolvedModel?.isPaidInFullOnline) &&
    amountDue <= 0 &&
    tapToPayAmount <= 0 &&
    inPersonPaid <= 0;

  const onlinePaidRowLabel = useMemo(() => {
    if (paidOnline <= 0) {
      return null;
    }
    if (isPaidInFullOnline) {
      return 'Paid online';
    }
    return getCompleteVisitPaidRowLabel(paidOnline, amountDue);
  }, [amountDue, isPaidInFullOnline, paidOnline]);

  const showCollectActions = amountDue > 0;
  const showReceiptEmailNotice =
    showTapToPay && showCollectActions && !isValidEmailFormat(savedReceiptEmail);
  const hasSavedReceiptEmail = isValidEmailFormat(savedReceiptEmail);

  const followUpInfo = useMemo(() => {
    if (!resolvedModel) {
      return { visible: false, message: '', iconName: 'information-circle-outline' };
    }
    const showReviewSms = resolvedModel.showReviewSms ?? false;
    const showReviewInvite = resolvedModel.showReviewInvite !== false;
    return getCompleteVisitFollowUpInfo({
      showInvoiceEmail: hasSavedReceiptEmail,
      showReviewSms,
      showReviewEmail: hasSavedReceiptEmail && !showReviewSms,
      showReviewInvite,
    });
  }, [hasSavedReceiptEmail, resolvedModel]);

  const successCopy = useMemo(() => {
    if (!resolvedModel) {
      return getCompleteVisitSuccessCopy({});
    }
    const showReviewSms = resolvedModel.showReviewSms ?? false;
    const showReviewInvite = resolvedModel.showReviewInvite !== false;
    return getCompleteVisitSuccessCopy({
      showReviewSms,
      showReviewEmail: hasSavedReceiptEmail && !showReviewSms,
      showReviewInvite,
    });
  }, [hasSavedReceiptEmail, resolvedModel]);

  const handleSaveReceiptEmail = useCallback(
    async (emailInput) => {
      const email = String(emailInput ?? receiptEmailDraft).trim();
      if (!isValidEmailFormat(email)) {
        toast.error(COMPLETE_VISIT_RECEIPT_EMAIL_INVALID_TOAST);
        throw new Error('invalid_email');
      }

      if (isDesignPreview) {
        setSavedReceiptEmail(email);
        setReceiptEmailDraft(email);
        setReceiptEmailDialogVisible(false);
        Keyboard.dismiss();
        return;
      }

      const id = bookingId?.trim();
      if (!id) {
        throw new Error('missing_booking');
      }

      const cached = queryClient.getQueryData(bookingsDetailsQueryKey(id));
      const customerId =
        cached && typeof cached === 'object' && cached.customer_id
          ? String(cached.customer_id).trim()
          : null;
      const businessId =
        cached && typeof cached === 'object' && cached.business_id
          ? String(cached.business_id).trim()
          : null;

      const { error } = await updateBookingCustomerEmail(id, email, {
        businessId,
        customerId,
      });
      if (error) {
        toast.error(error.message ?? COMPLETE_VISIT_RECEIPT_EMAIL_SAVE_ERROR_TOAST);
        throw error;
      }
      setSavedReceiptEmail(email);
      setReceiptEmailDraft(email);
      queryClient.setQueryData(bookingsDetailsQueryKey(id), (old) =>
        old && typeof old === 'object' ? { ...old, customer_email: email } : old,
      );
      setReceiptEmailDialogVisible(false);
      Keyboard.dismiss();
    },
    [bookingId, isDesignPreview, queryClient, receiptEmailDraft, toast],
  );

  const tapToPayBlocksComplete =
    tapToPayAmount > 0 && !stripePaymentIntentId?.trim() && !isDesignPreview;
  const checkoutSubmitReady = canSubmitJobCompletedCheckout({
    tapToPayAmount,
    stripePaymentIntentId,
    isDesignPreview,
  });
  const canCompleteVisit = amountDue <= 0 && checkoutSubmitReady && !tapToPayBlocksComplete;

  const completeHint = useMemo(() => {
    if (amountDue > 0) {
      return 'Collect payment to complete this booking.';
    }
    if (tapToPayBlocksComplete) {
      return 'Tap to Pay did not finish. Try again or mark as paid.';
    }
    return null;
  }, [amountDue, tapToPayBlocksComplete]);

  const isSubmitting = submitPhase === 'pending';
  const isSuccess = submitPhase === 'success';
  const showSubmitOverlay = isSubmitting || isSuccess;
  const successFooterInset = 12 + 52 + Math.max(insets.bottom, 12);

  const handleMarkPaidInPerson = (method, amount) => {
    setInPersonPayment({ method, amount });
    clearTapToPayState();
  };

  const clearTapToPayState = () => {
    setTapToPayAmount(0);
    setStripePaymentIntentId(null);
  };

  const handleTapToPaySuccess = async ({ amountCents, paymentIntentId }) => {
    const amount = amountCents / 100;
    const intentId = paymentIntentId?.trim() || null;
    setTapToPayAmount(amount);
    setInPersonPayment(null);
    setStripePaymentIntentId(intentId);

    if (intentId && TAP_TO_PAY_USE_TERMINAL_SDK && onComplete) {
      try {
        setSubmitPhase('pending');
        const checkout = buildCompleteVisitCheckoutFromSheetState({
          adjustments,
          tapToPayAmount: amount,
          inPersonPayment: null,
          stripePaymentIntentId: intentId,
        });
        await onComplete(checkout);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setSubmitPhase('success');
      } catch {
        clearTapToPayState();
        setSubmitPhase('idle');
      }
    }
  };

  const handleAddFee = (fee) => {
    clearTapToPayState();
    setAdjustments((prev) => [
      ...prev,
      { id: `adj-${Date.now()}`, label: fee.label, amount: fee.amount },
    ]);
  };

  const handleRemoveFee = (id) => {
    clearTapToPayState();
    setAdjustments((prev) => prev.filter((item) => item.id !== id));
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
        },
        sheet: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        header: {
          alignItems: 'center',
          borderBottomColor: colors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingBottom: 12,
          paddingHorizontal: 8,
        },
        headerSide: {
          alignItems: 'center',
          height: 40,
          justifyContent: 'center',
          width: 40,
        },
        headerTitle: {
          color: colors.text,
          flex: 1,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.25,
          textAlign: 'center',
        },
        bodyFlex: {
          flex: 1,
          position: 'relative',
        },
        errorWrap: {
          paddingHorizontal: 16,
          paddingTop: 16,
        },
        footer: {
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          gap: 8,
          paddingHorizontal: 16,
          paddingTop: 12,
        },
        completeButtonBlocked: {
          opacity: 0.45,
        },
        footerOverlay: {
          backgroundColor: colors.shell,
          bottom: 0,
          left: 0,
          position: 'absolute',
          right: 0,
          zIndex: 12,
        },
      }),
    [colors],
  );

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    runClose(onRequestClose);
  };

  const handleTapToPaySetupPress = useCallback(() => {
    if (isSubmitting || isDesignPreview) {
      return;
    }
    runClose(() => {
      onRequestClose();
      navigateToPaymentsSetup(navigation);
    });
  }, [isDesignPreview, isSubmitting, navigation, onRequestClose, runClose]);

  const handleCompleteVisit = useCallback(async () => {
    if (submitPhase !== 'idle' || !resolvedModel || amountDue > 0) {
      return;
    }
    Keyboard.dismiss();
    setSubmitPhase('pending');

    if (isDesignPreview || !onComplete) {
      completeTimeoutRef.current = setTimeout(() => {
        completeTimeoutRef.current = null;
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
          if (Platform.OS === 'android') {
            Vibration.vibrate(40);
          }
        });
        setSubmitPhase('success');
      }, MOCK_COMPLETE_MS);
      return;
    }

    try {
      const checkout = buildCompleteVisitCheckoutFromSheetState({
        adjustments,
        tapToPayAmount,
        inPersonPayment,
        stripePaymentIntentId,
      });
      await onComplete(checkout);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
        if (Platform.OS === 'android') {
          Vibration.vibrate(40);
        }
      });
      setSubmitPhase('success');
    } catch {
      setSubmitPhase('idle');
    }
  }, [
    MOCK_COMPLETE_MS,
    adjustments,
    amountDue,
    inPersonPayment,
    isDesignPreview,
    onComplete,
    resolvedModel,
    stripePaymentIntentId,
    submitPhase,
    tapToPayAmount,
  ]);

  const handleCompletePress = useCallback(() => {
    if (!canCompleteVisit) {
      toast.error(completeHint ?? 'Collect payment to complete this booking.');
      return;
    }
    void handleCompleteVisit();
  }, [canCompleteVisit, completeHint, handleCompleteVisit, toast]);

  const handleDoneAfterSuccess = () => {
    handleClose();
  };

  const resolvedTapToPayConnectReady = isDesignPreview ? true : tapToPayConnectReady;
  const resolvedTapToPayConnectLoading = isDesignPreview ? false : tapToPayConnectLoading;

  const tapToPayPrewarmConnectParams = useMemo(() => {
    const locationId = terminalLocationId?.trim() ?? '';
    const accountId = stripeAccountId?.trim() ?? '';
    if (!locationId || !accountId) {
      return null;
    }
    return { terminalLocationId: locationId, stripeAccountId: accountId };
  }, [stripeAccountId, terminalLocationId]);

  useTapToPayReaderPrewarm({
    enabled:
      visible &&
      showCollectActions &&
      showTapToPay &&
      resolvedTapToPayConnectReady &&
      !isDesignPreview,
    connectParams: tapToPayPrewarmConnectParams,
    merchantDisplayName,
    reason: 'complete_sheet',
  });

  if (!mounted) {
    return null;
  }

  return (
    <Modal animationType="none" transparent visible={mounted} onRequestClose={handleClose}>
      <BottomSheetOverlayProvider>
        <View style={styles.root}>
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              backdropStyle,
              { backgroundColor: colors.shell },
            ]}
          />
          <Animated.View style={[styles.sheet, sheetStyle, { paddingTop: insets.top }]}>
            {!showSubmitOverlay ? (
              <View style={styles.header}>
                <Pressable
                  accessibilityLabel="Close"
                  accessibilityRole="button"
                  hitSlop={8}
                  style={styles.headerSide}
                  onPress={handleClose}
                >
                  <Ionicons color={colors.textMuted} name="close" size={24} />
                </Pressable>
                <AppText style={styles.headerTitle}>Payment</AppText>
                <View style={styles.headerSide} />
              </View>
            ) : null}

            <View style={styles.bodyFlex}>
              {isLoading ? <CompleteVisitPaymentSkeleton bottomInset={insets.bottom} /> : null}
              {!showSubmitOverlay && !isLoading && loadError ? (
                <View style={styles.errorWrap}>
                  <InlineCardError message={loadError} />
                </View>
              ) : null}
              {!showSubmitOverlay && !isLoading && !loadError && resolvedModel ? (
                <>
                  <CompleteVisitDesignBody
                    accessToken={accessToken}
                    adjustments={adjustments}
                    amountDue={amountDue}
                    bookingId={bookingId}
                    followUpInfo={followUpInfo}
                    inPersonPayment={inPersonPayment}
                    iosKeyboardScrollPadding={iosKeyboardScrollPadding}
                    lineItems={resolvedModel.lineItems}
                    merchantDisplayName={merchantDisplayName}
                    onlinePaidRowLabel={onlinePaidRowLabel}
                    paidOnline={paidOnline}
                    showCollectActions={showCollectActions}
                    showReceiptEmailNotice={showReceiptEmailNotice}
                    showTapToPay={showTapToPay}
                    tapToPayConnectLoading={resolvedTapToPayConnectLoading}
                    tapToPayConnectReady={resolvedTapToPayConnectReady}
                    tapToPayPrewarmConnectParams={tapToPayPrewarmConnectParams}
                    subtotal={subtotal}
                    tapToPayAmount={tapToPayAmount}
                    savedReceiptEmail={savedReceiptEmail}
                    onPressAddReceiptEmail={() => setReceiptEmailDialogVisible(true)}
                    onAddFee={handleAddFee}
                    onMarkPaidInPerson={handleMarkPaidInPerson}
                    onRemoveFee={handleRemoveFee}
                    onTapToPaySetupPress={handleTapToPaySetupPress}
                    onTapToPaySuccess={handleTapToPaySuccess}
                  />

                  <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                    <Button
                      accessibilityHint={
                        canCompleteVisit
                          ? undefined
                          : 'Collect the remaining balance with Tap to Pay or Mark as paid'
                      }
                      disabled={isSubmitting}
                      fullWidth
                      iconName="checkmark-done-outline"
                      style={
                        !canCompleteVisit && !isSubmitting
                          ? styles.completeButtonBlocked
                          : undefined
                      }
                      title="Complete"
                      variant="primary"
                      onPress={handleCompletePress}
                    />
                  </View>
                </>
              ) : null}

              {showSubmitOverlay ? (
                <CompleteVisitSubmitOverlay
                  bottomInset={isSuccess ? successFooterInset : 0}
                  includesReviewLink={resolvedModel?.showReviewInvite !== false}
                  phase={isSubmitting ? 'pending' : 'success'}
                  successDetail={successCopy.detail}
                  successTitle={successCopy.title}
                />
              ) : null}

              {isSuccess ? (
                <View
                  style={[
                    styles.footer,
                    styles.footerOverlay,
                    { paddingBottom: Math.max(insets.bottom, 12) },
                  ]}
                >
                  <Button
                    fullWidth
                    title="Done"
                    variant="primary"
                    onPress={handleDoneAfterSuccess}
                  />
                </View>
              ) : null}
            </View>
          </Animated.View>
          <ToastModalHost />
          {receiptEmailDialogVisible ? (
            <CompleteVisitReceiptEmailDialog
              initialEmail={savedReceiptEmail || receiptEmailDraft}
              visible={receiptEmailDialogVisible}
              onClose={() => setReceiptEmailDialogVisible(false)}
              onSave={handleSaveReceiptEmail}
            />
          ) : null}
        </View>
      </BottomSheetOverlayProvider>
    </Modal>
  );
}

/** @deprecated Use {@link BookingCompleteVisitSheet} */
export const BookingCompleteInvoiceDesignSheet = BookingCompleteVisitSheet;
