import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { formatTapToPayAmount, resolveTapToPaySheetCopy } from '../constants/tapToPayCopy';
import { TAP_TO_PAY_FOOTER_BUTTON_MIN_HEIGHT } from '../constants/tapToPayLayout';
import { useTapToPaySheet } from '../hooks/useTapToPaySheet';
import { TapToPayStatusPanel } from './TapToPayStatusPanel';

const CLOSE_ANIMATION_MS = 280;

/**
 * In-person contactless collection (Stripe Tap to Pay on iPhone).
 *
 * @param {{
 *   onClose: () => void;
 *   amountDue: number;
 *   bookingId?: string | null;
 *   accessToken?: string | null;
 *   sessionFees?: Array<{ label: string; amountCents: number }>;
 *   merchantDisplayName?: string | null;
 *   prewarmConnectParams?: import('../utils/parseTapToPayIntentConnectParams').TapToPayConnectParams | null;
 *   onSuccess: (result: { amountCents: number; paymentIntentId: string | null }) => void;
 * }} props
 */
export function TapToPaySheet({
  onClose,
  amountDue,
  bookingId = null,
  accessToken = null,
  sessionFees = [],
  merchantDisplayName = null,
  prewarmConnectParams = null,
  onSuccess,
}) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(true);
  const pendingAfterCloseRef = useRef(null);

  const runClose = useCallback((afterClose) => {
    pendingAfterCloseRef.current = typeof afterClose === 'function' ? afterClose : null;
    setVisible(false);
  }, []);

  const finishPendingClose = useCallback(() => {
    const afterClose = pendingAfterCloseRef.current;
    pendingAfterCloseRef.current = null;
    afterClose?.();
  }, []);

  useEffect(() => {
    if (visible) {
      return undefined;
    }
    const delay =
      typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? 0 : CLOSE_ANIMATION_MS;
    const id = setTimeout(finishPendingClose, delay);
    return () => clearTimeout(id);
  }, [finishPendingClose, visible]);

  const flow = useTapToPaySheet({
    accessToken,
    bookingId,
    sessionFees,
    amountDueDollars: amountDue,
    merchantDisplayName,
    prewarmConnectParams,
    onClose,
    onSuccess,
    runClose,
  });

  const handleDismiss = useCallback(() => {
    if (flow.locksSheet) {
      return;
    }
    runClose(onClose);
  }, [flow.locksSheet, onClose, runClose]);

  const copy = useMemo(
    () =>
      resolveTapToPaySheetCopy(flow.phase, flow.displayAmountDollars, flow.intentError, {
        readerWasWarm: flow.readerWasWarmAtStart,
      }),
    [flow.displayAmountDollars, flow.intentError, flow.phase, flow.readerWasWarmAtStart],
  );

  const isLoadingVisual = flow.isLoadingIntent || flow.isPreparing || flow.isProcessing;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        amountLine: {
          color: colors.text,
          fontSize: 28,
          fontWeight: '800',
          letterSpacing: -0.5,
          lineHeight: 34,
        },
        sheetHint: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginTop: 6,
        },
        footerWrap: {
          marginTop: 10,
        },
        tryAgainFooterSlot: {
          minHeight: TAP_TO_PAY_FOOTER_BUTTON_MIN_HEIGHT,
          width: '100%',
        },
      }),
    [colors],
  );

  const footer =
    flow.showTryAgainFooter && flow.isError ? (
      <View style={styles.footerWrap}>
        <Button fullWidth title="Try again" variant="secondary" onPress={flow.handleTryAgain} />
      </View>
    ) : flow.showTryAgainFooter ? (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.footerWrap, styles.tryAgainFooterSlot]}
      />
    ) : null;

  return (
    <BottomSheetModal
      allowBackdropClose={!flow.locksSheet}
      fitContent
      footer={footer}
      title={copy.title}
      visible={visible}
      onRequestClose={handleDismiss}
    >
      <AppText accessibilityRole="text" style={styles.amountLine}>
        {formatTapToPayAmount(flow.displayAmountDollars || amountDue)}
      </AppText>
      {copy.hint ? <AppText style={styles.sheetHint}>{copy.hint}</AppText> : null}

      <TapToPayStatusPanel
        isLoadingIntent={flow.isLoadingIntent}
        isLoadingVisual={isLoadingVisual}
        isProcessing={flow.isProcessing}
        phase={flow.phase}
        statusLine={copy.statusLine}
      />
    </BottomSheetModal>
  );
}
