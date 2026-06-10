import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
  LabelValueRow,
  useBottomSheetOverlay,
} from '../../../../components/ui';
import { useModalFadeBackdropSlideSheet } from '../../../../components/ui/useModalFadeBackdropSlideSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import {
  BOOKING_COMPLETE_INVOICE_DESIGN_MOCK,
  getCompleteVisitFollowUpInfo,
} from '../constants/bookingCompleteInvoiceDesignMock';
import { getCompleteVisitSuccessCopy } from '../constants/completeVisitSuccessCopy';
import { CompleteVisitSubmitOverlay } from './CompleteVisitSubmitOverlay';
import { CompleteVisitAddFeeSheet } from './CompleteVisitAddFeeSheet';
import { CompleteVisitPaymentLinkSheet } from './CompleteVisitPaymentLinkSheet';
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
 *   adjustments: Array<{ id: string; label: string; amount: number }>;
 *   onAddFee: (fee: { label: string; amount: number }) => void;
 *   onRemoveFee: (id: string) => void;
 *   paymentLinkEmailSent: boolean;
 *   paymentLinkCopied: boolean;
 *   onPaymentLinkEmailSent: () => void;
 *   onPaymentLinkCopied: () => void;
 *   onMarkPaidInPerson: (method: string, amount: number) => void;
 *   amountDue: number;
 *   subtotal: number;
 *   paidOnline: number;
 *   inPersonPayment: { method: string; amount: number } | null;
 *   onlinePaidRowLabel: string | null;
 *   showCollectActions: boolean;
 *   followUpInfo: { visible: boolean; email: string | null; message: string };
 *   iosKeyboardScrollPadding: number;
 * }} props
 */
function CompleteVisitDesignBody({
  adjustments,
  onAddFee,
  onRemoveFee,
  paymentLinkEmailSent,
  paymentLinkCopied,
  onPaymentLinkEmailSent,
  onPaymentLinkCopied,
  amountDue,
  subtotal,
  paidOnline,
  inPersonPayment,
  onlinePaidRowLabel,
  showCollectActions,
  followUpInfo,
  iosKeyboardScrollPadding,
  onMarkPaidInPerson,
}) {
  const { colors } = useTheme();
  const mock = BOOKING_COMPLETE_INVOICE_DESIGN_MOCK;
  const overlay = useBottomSheetOverlay();

  useEffect(() => () => overlay?.hide(), [overlay]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scrollContent: {
          gap: 16,
          paddingHorizontal: 20,
          paddingTop: 16,
        },
        breakdownRows: {
          gap: 2,
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
        paymentLinkWrap: {
          gap: 6,
        },
        paymentLinkStatus: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
        },
        followUpRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 8,
          marginTop: 4,
        },
        followUpIcon: {
          marginTop: 1,
        },
        followUpText: {
          color: colors.textMuted,
          flex: 1,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          minWidth: 0,
        },
        followUpEmail: {
          color: colors.textSecondary,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  const openAddFeeSheet = () => {
    Keyboard.dismiss();
    overlay?.show(<CompleteVisitAddFeeSheet onAdd={onAddFee} onClose={() => overlay.hide()} />);
  };

  const openPaymentLinkSheet = () => {
    Keyboard.dismiss();
    overlay?.show(
      <CompleteVisitPaymentLinkSheet
        amountDue={amountDue}
        customerEmail={mock.customerEmail}
        paymentLinkUrl={mock.paymentLinkUrl}
        onClose={() => overlay.hide()}
        onEmailSent={onPaymentLinkEmailSent}
        onLinkCopied={onPaymentLinkCopied}
      />,
    );
  };

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
      <DetailsSectionCard bodyPadding="roomy" title="Breakdown">
        <View style={styles.breakdownRows}>
          {mock.lineItems.map((item, index) => (
            <LabelValueRow
              key={item.id}
              label={item.label}
              noTopMargin={index === 0}
              value={formatUsd(item.amount)}
            />
          ))}

          {adjustments.map((item) => (
            <View key={item.id} style={styles.adjustmentRow}>
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
              <AppText style={styles.adjustmentAmount}>{formatUsd(item.amount)}</AppText>
            </View>
          ))}
        </View>
      </DetailsSectionCard>

      <Button
        fullWidth
        iconName="add-circle-outline"
        title="Add fee"
        variant="secondary"
        onPress={openAddFeeSheet}
      />

      <DetailsSectionCard bodyPadding="roomy" title="Payment">
        <View style={styles.totalRow}>
          <AppText style={styles.totalLabel}>Total</AppText>
          <AppText style={styles.totalValue}>{formatUsd(subtotal)}</AppText>
        </View>
        {onlinePaidRowLabel ? (
          <LabelValueRow label={onlinePaidRowLabel} value={`−${formatUsd(paidOnline)}`} />
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
        {showCollectActions ? (
          <View style={styles.paymentActions}>
            <View style={styles.paymentLinkWrap}>
              <Button
                fullWidth
                iconName="link-outline"
                title="Payment link"
                variant="secondary"
                onPress={openPaymentLinkSheet}
              />
              {paymentLinkEmailSent ? (
                <AppText style={styles.paymentLinkStatus}>Sent to {mock.customerEmail}</AppText>
              ) : null}
              {paymentLinkCopied ? (
                <AppText style={styles.paymentLinkStatus}>Link copied — ready to paste</AppText>
              ) : null}
            </View>
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

      {followUpInfo.visible ? (
        <View style={styles.followUpRow}>
          <Ionicons
            color={colors.textMuted}
            name="information-circle-outline"
            size={18}
            style={styles.followUpIcon}
          />
          {followUpInfo.email ? (
            <AppText style={styles.followUpText}>
              <AppText style={styles.followUpEmail}>{followUpInfo.email}</AppText>
              {' — '}
              {followUpInfo.message}
            </AppText>
          ) : (
            <AppText style={styles.followUpText}>{followUpInfo.message}</AppText>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

/**
 * Full-screen complete visit flow (design preview only — mock data, no API).
 *
 * @param {{
 *   visible: boolean;
 *   onRequestClose: () => void;
 * }} props
 */
export function BookingCompleteInvoiceDesignSheet({ visible, onRequestClose }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const mock = BOOKING_COMPLETE_INVOICE_DESIGN_MOCK;

  const { prepareOpen, runOpen, runClose, backdropStyle, sheetStyle } =
    useModalFadeBackdropSlideSheet();
  const [mounted, setMounted] = useState(visible);
  const [iosKeyboardScrollPadding, setIosKeyboardScrollPadding] = useState(0);

  const [adjustments, setAdjustments] = useState(
    /** @type {Array<{ id: string; label: string; amount: number }>} */ ([]),
  );
  const [paymentLinkEmailSent, setPaymentLinkEmailSent] = useState(false);
  const [paymentLinkCopied, setPaymentLinkCopied] = useState(false);
  const [inPersonPayment, setInPersonPayment] = useState(
    /** @type {{ method: string; amount: number } | null} */ (null),
  );
  const [submitPhase, setSubmitPhase] = useState(
    /** @type {'idle' | 'pending' | 'success'} */ ('idle'),
  );
  const completeTimeoutRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

  const MOCK_COMPLETE_MS = 2400;

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
      setPaymentLinkEmailSent(false);
      setPaymentLinkCopied(false);
      setInPersonPayment(null);
      setSubmitPhase('idle');
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

  const subtotal = useMemo(() => {
    const base = mock.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const adj = adjustments.reduce((sum, item) => sum + item.amount, 0);
    return base + adj;
  }, [adjustments, mock.lineItems]);

  const inPersonPaid = inPersonPayment?.amount ?? 0;
  const amountDue = Math.max(0, subtotal - mock.paidOnline - inPersonPaid);

  const onlinePaidRowLabel = useMemo(() => {
    if (mock.paidOnline <= 0) {
      return null;
    }
    if (mock.paidOnline >= subtotal && inPersonPaid <= 0) {
      return 'Paid in full';
    }
    return 'Deposit paid';
  }, [inPersonPaid, mock.paidOnline, subtotal]);

  const showCollectActions = amountDue > 0;

  const followUpInfo = useMemo(
    () =>
      getCompleteVisitFollowUpInfo({
        customerEmail: mock.customerEmail,
        showInvoiceEmail: mock.showInvoiceEmail,
        showReviewInvite: mock.showReviewInvite,
      }),
    [mock],
  );

  const successCopy = useMemo(
    () =>
      getCompleteVisitSuccessCopy({
        customerEmail: mock.customerEmail,
        showInvoiceEmail: mock.showInvoiceEmail,
        showReviewInvite: mock.showReviewInvite,
      }),
    [mock],
  );

  const isSubmitting = submitPhase === 'pending';
  const isSuccess = submitPhase === 'success';
  const showSubmitOverlay = isSubmitting || isSuccess;
  const successFooterInset = 12 + 52 + Math.max(insets.bottom, 12);

  const handleMarkPaidInPerson = (method, amount) => {
    setInPersonPayment({ method, amount });
    setPaymentLinkEmailSent(false);
    setPaymentLinkCopied(false);
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
        footer: {
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingHorizontal: 20,
          paddingTop: 12,
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

  const handleCompleteVisit = useCallback(() => {
    if (submitPhase !== 'idle') {
      return;
    }
    Keyboard.dismiss();
    setSubmitPhase('pending');
    completeTimeoutRef.current = setTimeout(() => {
      completeTimeoutRef.current = null;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
        if (Platform.OS === 'android') {
          Vibration.vibrate(40);
        }
      });
      setSubmitPhase('success');
    }, MOCK_COMPLETE_MS);
  }, [MOCK_COMPLETE_MS, submitPhase]);

  const handleDoneAfterSuccess = () => {
    handleClose();
  };

  const handleAddFee = (fee) => {
    setAdjustments((prev) => [
      ...prev,
      { id: `adj-${Date.now()}`, label: fee.label, amount: fee.amount },
    ]);
  };

  const handleRemoveFee = (id) => {
    setAdjustments((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePaymentLinkEmailSent = () => {
    setPaymentLinkEmailSent(true);
  };

  const handlePaymentLinkCopied = () => {
    setPaymentLinkCopied(true);
  };

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
            <View style={styles.header}>
              <Pressable
                accessibilityLabel="Close"
                accessibilityRole="button"
                disabled={isSubmitting}
                hitSlop={8}
                style={styles.headerSide}
                onPress={handleClose}
              >
                <Ionicons
                  color={isSubmitting ? colors.border : colors.textMuted}
                  name="close"
                  size={24}
                />
              </Pressable>
              <AppText style={styles.headerTitle}>
                {isSuccess ? 'Visit complete' : 'Complete visit'}
              </AppText>
              <View style={styles.headerSide} />
            </View>

            <View style={styles.bodyFlex}>
              {!showSubmitOverlay ? (
                <>
                  <CompleteVisitDesignBody
                    adjustments={adjustments}
                    amountDue={amountDue}
                    followUpInfo={followUpInfo}
                    inPersonPayment={inPersonPayment}
                    iosKeyboardScrollPadding={iosKeyboardScrollPadding}
                    onlinePaidRowLabel={onlinePaidRowLabel}
                    paidOnline={mock.paidOnline}
                    paymentLinkCopied={paymentLinkCopied}
                    paymentLinkEmailSent={paymentLinkEmailSent}
                    showCollectActions={showCollectActions}
                    subtotal={subtotal}
                    onAddFee={handleAddFee}
                    onMarkPaidInPerson={handleMarkPaidInPerson}
                    onPaymentLinkCopied={handlePaymentLinkCopied}
                    onPaymentLinkEmailSent={handlePaymentLinkEmailSent}
                    onRemoveFee={handleRemoveFee}
                  />

                  <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                    <Button
                      fullWidth
                      iconName="checkmark-done-outline"
                      title="Complete visit"
                      variant="primary"
                      onPress={handleCompleteVisit}
                    />
                  </View>
                </>
              ) : null}

              {showSubmitOverlay ? (
                <CompleteVisitSubmitOverlay
                  bottomInset={isSuccess ? successFooterInset : 0}
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
        </View>
      </BottomSheetOverlayProvider>
    </Modal>
  );
}
