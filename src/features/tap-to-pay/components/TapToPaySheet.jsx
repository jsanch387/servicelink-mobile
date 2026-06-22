import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, EchoBarsLoader } from '../../../components/ui';
import { useModalFadeBackdropSlideSheet } from '../../../components/ui/useModalFadeBackdropSlideSheet';
import { useTheme } from '../../../theme';
import { TapToPayPulseVisual } from './TapToPayPulseVisual';
import { formatTapToPayAmount, resolveTapToPaySheetCopy } from '../constants/tapToPayCopy';
import {
  TAP_TO_PAY_FOOTER_BUTTON_MIN_HEIGHT,
  TAP_TO_PAY_PAYMENT_CARD_HEIGHT,
  TAP_TO_PAY_STATUS_SLOT_MIN_HEIGHT,
} from '../constants/tapToPayLayout';
import { useTapToPaySheet } from '../hooks/useTapToPaySheet';

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
  onSuccess,
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { prepareOpen, runOpen, runClose, backdropStyle, sheetStyle } =
    useModalFadeBackdropSlideSheet();

  const close = useCallback(() => {
    runClose(onClose);
  }, [onClose, runClose]);

  const flow = useTapToPaySheet({
    accessToken,
    bookingId,
    sessionFees,
    amountDueDollars: amountDue,
    merchantDisplayName,
    onClose,
    onSuccess,
    runClose,
  });

  const handleDismiss = useCallback(() => {
    if (flow.locksSheet) {
      return;
    }
    close();
  }, [close, flow.locksSheet]);

  useEffect(() => {
    prepareOpen();
    const id = requestAnimationFrame(() => runOpen());
    return () => cancelAnimationFrame(id);
  }, [prepareOpen, runOpen]);

  const copy = useMemo(
    () =>
      resolveTapToPaySheetCopy(flow.phase, flow.displayAmountDollars, flow.intentError, {
        readerWasWarm: flow.readerWasWarmAtStart,
      }),
    [flow.displayAmountDollars, flow.intentError, flow.phase, flow.readerWasWarmAtStart],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlayRoot: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: 'flex-end',
        },
        backdropFill: {
          backgroundColor: 'rgba(0,0,0,0.55)',
        },
        sheetWrap: {
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderTopWidth: 1,
          bottom: 0,
          left: 0,
          position: 'absolute',
          right: 0,
        },
        sheetContent: {
          paddingBottom: Math.max(insets.bottom, 16) + 12,
          paddingHorizontal: 20,
          paddingTop: 18,
        },
        closeRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 4,
        },
        sheetTitle: {
          color: colors.text,
          flex: 1,
          fontSize: 18,
          fontWeight: '800',
          letterSpacing: -0.25,
        },
        closeBtn: {
          alignItems: 'center',
          height: 36,
          justifyContent: 'center',
          width: 36,
        },
        amountLine: {
          color: colors.text,
          fontSize: 28,
          fontWeight: '800',
          letterSpacing: -0.5,
          lineHeight: 34,
          marginTop: 8,
        },
        sheetHint: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginTop: 6,
        },
        paymentCard: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 16,
          borderWidth: StyleSheet.hairlineWidth,
          height: TAP_TO_PAY_PAYMENT_CARD_HEIGHT,
          marginBottom: 20,
          marginTop: 20,
          overflow: 'hidden',
          paddingHorizontal: 12,
          position: 'relative',
          width: '100%',
        },
        loadingVisual: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        },
        cardVisualStack: {
          alignItems: 'center',
          height: TAP_TO_PAY_PAYMENT_CARD_HEIGHT,
          justifyContent: 'center',
          paddingBottom: 18,
          pointerEvents: 'none',
          width: '100%',
        },
        statusSlot: {
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 4,
          minHeight: TAP_TO_PAY_STATUS_SLOT_MIN_HEIGHT,
          paddingHorizontal: 8,
        },
        statusLine: {
          color: colors.textSecondary,
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: -0.1,
          textAlign: 'center',
        },
        footerStack: {
          gap: 10,
        },
        tryAgainFooterSlot: {
          minHeight: TAP_TO_PAY_FOOTER_BUTTON_MIN_HEIGHT,
          width: '100%',
        },
      }),
    [colors, insets.bottom],
  );

  const visual = (
    <>
      {flow.isLoadingIntent || flow.isPreparing ? (
        <View style={styles.loadingVisual}>
          <EchoBarsLoader
            accessibilityLabel={flow.isLoadingIntent ? 'Preparing payment' : 'Opening Tap to Pay'}
            color={colors.text}
            size="large"
          />
          {!flow.isLoadingIntent && copy.statusLine ? (
            <View style={styles.statusSlot}>
              <AppText style={styles.statusLine}>{copy.statusLine}</AppText>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.cardVisualStack}>
          <TapToPayPulseVisual
            accentColor={colors.text}
            phase={flow.phase === 'success' ? 'success' : 'error'}
          />
          <View style={styles.statusSlot}>
            {copy.statusLine ? (
              <AppText style={styles.statusLine}>{copy.statusLine}</AppText>
            ) : null}
          </View>
        </View>
      )}
    </>
  );

  return (
    <View pointerEvents="box-none" style={styles.overlayRoot}>
      <Pressable
        accessibilityLabel="Dismiss"
        accessibilityRole="button"
        style={StyleSheet.absoluteFillObject}
        onPress={handleDismiss}
      >
        <Animated.View
          style={[StyleSheet.absoluteFillObject, styles.backdropFill, backdropStyle]}
        />
      </Pressable>
      <Animated.View
        style={[
          styles.sheetWrap,
          sheetStyle,
          { backgroundColor: colors.shell, borderTopColor: colors.border },
        ]}
      >
        <View style={styles.sheetContent}>
          <View style={styles.closeRow}>
            <AppText style={styles.sheetTitle}>{copy.title}</AppText>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              disabled={flow.locksSheet}
              hitSlop={8}
              style={styles.closeBtn}
              onPress={handleDismiss}
            >
              <MaterialCommunityIcons color={colors.textMuted} name="close" size={22} />
            </Pressable>
          </View>

          <AppText accessibilityRole="text" style={styles.amountLine}>
            {formatTapToPayAmount(flow.displayAmountDollars || amountDue)}
          </AppText>
          {copy.hint ? <AppText style={styles.sheetHint}>{copy.hint}</AppText> : null}

          <View style={styles.paymentCard}>{visual}</View>

          <View style={styles.footerStack}>
            {flow.showTryAgainFooter ? (
              flow.isError ? (
                <Button
                  fullWidth
                  title="Try again"
                  variant="primary"
                  onPress={flow.handleTryAgain}
                />
              ) : (
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={styles.tryAgainFooterSlot}
                />
              )
            ) : null}
            {flow.showDevDeclinePreview ? (
              <Button
                fullWidth
                title="Simulate decline"
                variant="secondary"
                onPress={flow.handleDeclinePreview}
              />
            ) : null}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
