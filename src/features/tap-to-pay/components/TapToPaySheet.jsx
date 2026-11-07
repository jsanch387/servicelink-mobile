import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { AnimatedCheckmark, AppText, Button, EchoBarsLoader } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { resolveTapToPaySheetCopy } from '../constants/tapToPayCopy';
import { useTapToPaySheet } from '../hooks/useTapToPaySheet';

const CLOSE_ANIMATION_MS = 280;
/** Pause before Try again accepts another tap, so a failure cannot be retried in a burst. */
const RETRY_WAIT_SECONDS = 4;

/**
 * @param {string | null | undefined} left
 * @param {string | null | undefined} right
 */
function sameLine(left, right) {
  const normalize = (value) =>
    String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[.!?]+$/g, '');
  const a = normalize(left);
  return a.length > 0 && a === normalize(right);
}

/**
 * Full-screen wait while Tap to Pay prepares, then Apple's reader takes over.
 * Cancel returns to the payment screen. A real failure stays here with Try again.
 *
 * @param {{
 *   onClose: () => void;
 *   amountDue: number;
 *   bookingId?: string | null;
 *   accessToken?: string | null;
 *   sessionFees?: Array<{ label: string; amountCents: number }>;
 *   tipCents?: number;
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
  tipCents = 0,
  merchantDisplayName = null,
  prewarmConnectParams = null,
  onSuccess,
}) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(true);
  const [retryWait, setRetryWait] = useState(0);
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
    tipCents,
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

  const errorSession = flow.isError ? `live:${flow.phase}:${flow.intentError ?? ''}` : null;

  useEffect(() => {
    if (!errorSession) {
      setRetryWait(0);
      return undefined;
    }
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      setRetryWait(0);
      return undefined;
    }
    setRetryWait(RETRY_WAIT_SECONDS);
    let remaining = RETRY_WAIT_SECONDS;
    const id = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        setRetryWait(0);
        clearInterval(id);
        return;
      }
      setRetryWait(remaining);
    }, 1000);
    return () => clearInterval(id);
  }, [errorSession]);

  const handleRetry = useCallback(() => {
    if (retryWait > 0) {
      return;
    }
    flow.handleTryAgain();
  }, [flow, retryWait]);

  const copy = useMemo(
    () =>
      resolveTapToPaySheetCopy(flow.phase, flow.displayAmountDollars, flow.intentError, {
        readerWasWarm: flow.readerWasWarmAtStart,
      }),
    [flow.displayAmountDollars, flow.intentError, flow.phase, flow.readerWasWarmAtStart],
  );

  const errorTitle = copy.statusLine || copy.title;
  const errorHint = copy.hint && !sameLine(copy.hint, errorTitle) ? copy.hint : null;
  const retryTitle = retryWait > 0 ? `Try again in ${retryWait}` : 'Try again';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        scroll: {
          flex: 1,
        },
        scrollContent: {
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 28,
          paddingVertical: 24,
        },
        loadingBlock: {
          alignItems: 'center',
          gap: 18,
        },
        status: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '600',
          letterSpacing: -0.2,
          textAlign: 'center',
        },
        errorBlock: {
          alignItems: 'center',
          gap: 12,
          width: '100%',
        },
        errorIcon: {
          alignItems: 'center',
          backgroundColor: 'rgba(248, 113, 113, 0.16)',
          borderRadius: 32,
          height: 64,
          justifyContent: 'center',
          marginBottom: 4,
          width: 64,
        },
        title: {
          color: colors.text,
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.3,
          textAlign: 'center',
        },
        hint: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 21,
          textAlign: 'center',
        },
        actions: {
          gap: 10,
          marginTop: 16,
          width: '100%',
        },
      }),
    [colors],
  );

  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      transparent={false}
      visible={visible}
      onRequestClose={handleDismiss}
    >
      <View style={styles.screen}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scroll}
        >
          {flow.phase === 'success' ? (
            <View style={styles.errorBlock}>
              <AnimatedCheckmark
                accessibilityLabel="Payment received"
                replayKey="payment-received"
                size={72}
              />
              <AppText style={styles.title}>{copy.title}</AppText>
              {copy.hint ? <AppText style={styles.hint}>{copy.hint}</AppText> : null}
            </View>
          ) : flow.isError ? (
            <View style={styles.errorBlock}>
              <View style={styles.errorIcon}>
                <Ionicons color={colors.danger} name="alert-circle" size={32} />
              </View>
              <AppText style={styles.title}>{errorTitle}</AppText>
              {errorHint ? <AppText style={styles.hint}>{errorHint}</AppText> : null}
              <View style={styles.actions}>
                <Button
                  accessibilityLabel={retryTitle}
                  disabled={retryWait > 0}
                  fullWidth
                  title={retryTitle}
                  variant="primary"
                  onPress={handleRetry}
                />
                <Button fullWidth title="Back" variant="secondary" onPress={handleDismiss} />
              </View>
            </View>
          ) : (
            <View style={styles.loadingBlock}>
              <EchoBarsLoader
                accessibilityLabel={copy.statusLine || 'Opening Tap to Pay'}
                color={colors.text}
                size="large"
              />
              <AppText style={styles.status}>{copy.statusLine || 'Opening Tap to Pay'}</AppText>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
