import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button } from '../../../../components/ui';
import { useModalFadeBackdropSlideSheet } from '../../../../components/ui/useModalFadeBackdropSlideSheet';
import { useTheme } from '../../../../theme';

function formatUsd(amount) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(safe);
}

export function getTapToPayRowLabel() {
  return 'Paid with card';
}

/**
 * Collect card payment in person via Tap to Pay (Stripe Terminal — design preview simulates success).
 *
 * @param {{
 *   onClose: () => void;
 *   amountDue: number;
 *   onSuccess: (amount: number) => void;
 * }} props
 */
export function CompleteVisitTapToPaySheet({ onClose, amountDue, onSuccess }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { prepareOpen, runOpen, runClose, backdropStyle, sheetStyle } =
    useModalFadeBackdropSlideSheet();
  const [collecting, setCollecting] = useState(false);

  const close = useCallback(() => {
    if (collecting) {
      return;
    }
    runClose(onClose);
  }, [collecting, onClose, runClose]);

  useEffect(() => {
    prepareOpen();
    const id = requestAnimationFrame(() => runOpen());
    return () => cancelAnimationFrame(id);
  }, [prepareOpen, runOpen]);

  const handleCollect = useCallback(() => {
    if (collecting || amountDue <= 0) {
      return;
    }
    setCollecting(true);
    // Design preview — replace with Stripe Terminal when wired.
    setTimeout(() => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onSuccess(amountDue);
      runClose(onClose);
    }, 1400);
  }, [amountDue, collecting, onClose, onSuccess, runClose]);

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
        sheetTitle: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '800',
          letterSpacing: -0.25,
          marginBottom: 6,
        },
        sheetHint: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginBottom: 20,
        },
        amountDue: {
          color: colors.text,
          fontWeight: '700',
        },
        iconWrap: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 16,
          borderWidth: StyleSheet.hairlineWidth,
          marginBottom: 20,
          paddingVertical: 28,
        },
        headerDivider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginBottom: 16,
        },
        closeRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 4,
        },
        closeBtn: {
          alignItems: 'center',
          height: 36,
          justifyContent: 'center',
          width: 36,
        },
      }),
    [colors, insets.bottom],
  );

  return (
    <View style={styles.overlayRoot} pointerEvents="box-none">
      <Pressable
        accessibilityLabel="Dismiss"
        accessibilityRole="button"
        style={StyleSheet.absoluteFillObject}
        onPress={close}
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
            <AppText style={styles.sheetTitle}>Tap to Pay</AppText>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              disabled={collecting}
              hitSlop={8}
              style={styles.closeBtn}
              onPress={close}
            >
              <MaterialCommunityIcons color={colors.textMuted} name="close" size={22} />
            </Pressable>
          </View>
          <AppText style={styles.sheetHint}>
            Have your customer hold their card or phone near yours. Collecting{' '}
            <AppText style={styles.amountDue}>{formatUsd(amountDue)}</AppText>.
          </AppText>
          <View style={styles.iconWrap}>
            {collecting ? (
              <ActivityIndicator color={colors.text} size="large" />
            ) : (
              <MaterialCommunityIcons color={colors.text} name="contactless-payment" size={56} />
            )}
          </View>
          <View style={styles.headerDivider} />
          <Button
            disabled={collecting || amountDue <= 0}
            fullWidth
            iconLibrary="material-community"
            iconName="contactless-payment"
            loading={collecting}
            title={collecting ? 'Waiting for card…' : 'Collect payment'}
            variant="surfaceDark"
            onPress={handleCollect}
          />
        </View>
      </Animated.View>
    </View>
  );
}
