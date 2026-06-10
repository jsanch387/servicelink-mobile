import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useMemo } from 'react';
import { Alert, Animated, Pressable, StyleSheet, View } from 'react-native';
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

/**
 * Slides up over the complete-visit full screen — send pay link by email or copy to share manually.
 *
 * @param {{
 *   onClose: () => void;
 *   amountDue: number;
 *   customerEmail?: string;
 *   paymentLinkUrl: string;
 *   onEmailSent?: () => void;
 *   onLinkCopied?: () => void;
 * }} props
 */
export function CompleteVisitPaymentLinkSheet({
  onClose,
  amountDue,
  customerEmail = '',
  paymentLinkUrl,
  onEmailSent,
  onLinkCopied,
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { prepareOpen, runOpen, runClose, backdropStyle, sheetStyle } =
    useModalFadeBackdropSlideSheet();

  const close = useCallback(() => {
    runClose(onClose);
  }, [runClose, onClose]);

  useEffect(() => {
    prepareOpen();
    const id = requestAnimationFrame(() => runOpen());
    return () => cancelAnimationFrame(id);
  }, [prepareOpen, runOpen]);

  const email = String(customerEmail ?? '').trim();
  const hasEmail = email.length > 0;

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
          marginBottom: 16,
        },
        amountDue: {
          color: colors.text,
          fontWeight: '700',
        },
        headerDivider: {
          backgroundColor: colors.border,
          height: 1,
          marginBottom: 16,
        },
        actions: {
          gap: 10,
        },
        linkPreview: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 12,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 10,
          marginTop: 14,
          paddingHorizontal: 12,
          paddingVertical: 12,
        },
        linkPreviewText: {
          color: colors.textMuted,
          flex: 1,
          fontSize: 13,
          fontWeight: '500',
          minWidth: 0,
        },
        cancelWrap: {
          marginTop: 14,
        },
      }),
    [colors, insets.bottom],
  );

  const handleSendEmail = () => {
    if (!hasEmail) {
      return;
    }
    onEmailSent?.();
    close();
    Alert.alert(
      'Payment link sent',
      `Design preview: ${formatUsd(amountDue)} pay link would be emailed to ${email}.`,
    );
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(paymentLinkUrl);
    onLinkCopied?.();
    close();
    Alert.alert('Link copied', 'Paste it in a text, DM, or WhatsApp to send manually.');
  };

  const emailButtonTitle = hasEmail ? 'Send by email' : 'Send by email (no address on file)';

  return (
    <View style={styles.overlayRoot}>
      <Animated.View
        pointerEvents="box-none"
        style={[StyleSheet.absoluteFillObject, backdropStyle, styles.backdropFill]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={close}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheetWrap,
          sheetStyle,
          {
            backgroundColor: colors.shellElevated,
            borderTopColor: colors.borderStrong,
          },
        ]}
      >
        <View style={styles.sheetContent}>
          <AppText style={styles.sheetTitle}>Payment link</AppText>
          <AppText style={styles.sheetHint}>
            Collect <AppText style={styles.amountDue}>{formatUsd(amountDue)}</AppText> — email it or
            copy and send your way.
          </AppText>
          <View style={styles.headerDivider} />

          <View style={styles.actions}>
            <Button
              disabled={!hasEmail}
              fullWidth
              iconName="mail-outline"
              title={emailButtonTitle}
              variant="primary"
              onPress={handleSendEmail}
            />
            <Button
              fullWidth
              iconName="copy-outline"
              title="Copy link"
              variant="secondary"
              onPress={() => void handleCopyLink()}
            />
          </View>

          <View style={styles.linkPreview}>
            <Ionicons color={colors.textMuted} name="link-outline" size={18} />
            <AppText ellipsizeMode="middle" numberOfLines={1} style={styles.linkPreviewText}>
              {paymentLinkUrl}
            </AppText>
          </View>

          <View style={styles.cancelWrap}>
            <Button fullWidth title="Cancel" variant="secondary" onPress={close} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
