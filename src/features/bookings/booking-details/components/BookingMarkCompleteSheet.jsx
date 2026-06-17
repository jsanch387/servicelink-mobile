import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button, InlineCardError } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import {
  BOOKING_MARK_COMPLETE_CANCEL_LABEL,
  getBookingMarkCompleteSheetCopy,
} from '../constants/bookingCompleteCopy';

/**
 * Confirm mark-complete — copy reflects whether a review invite will be sent (SMS, email, or neither).
 *
 * @param {{
 *   visible: boolean;
 *   onRequestClose: () => void;
 *   preview: {
 *     showReviewInviteMessage?: boolean;
 *     showReviewSmsMessage?: boolean;
 *     showNoReviewInviteMessage?: boolean;
 *   } | null;
 *   isLoadingPreview?: boolean;
 *   previewError?: string | null;
 *   isSubmitting?: boolean;
 *   onConfirm: () => void;
 * }} props
 */
export function BookingMarkCompleteSheet({
  visible,
  onRequestClose,
  preview,
  isLoadingPreview = false,
  previewError = null,
  isSubmitting = false,
  onConfirm,
}) {
  const { colors } = useTheme();
  const copy = useMemo(() => getBookingMarkCompleteSheetCopy(preview), [preview]);
  const showHighlight = copy.highlightVariant != null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          gap: 14,
        },
        highlightCard: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          gap: 8,
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        highlightTopRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
        },
        highlightTitle: {
          color: colors.text,
          flex: 1,
          fontSize: 15,
          fontWeight: '700',
          letterSpacing: -0.2,
          minWidth: 0,
        },
        highlightBody: {
          color: colors.textSecondary,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
        },
        body: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
        },
        loadingWrap: {
          alignItems: 'center',
          paddingVertical: 12,
        },
        footer: {
          flexDirection: 'row',
          gap: 12,
          marginTop: 20,
        },
        footerGrow: {
          flex: 1,
        },
      }),
    [colors],
  );

  const busy = isSubmitting;
  const canConfirm = !isLoadingPreview && !busy;

  const highlightIcon = showHighlight ? (
    <Ionicons
      color={colors.textSecondary}
      name={
        copy.highlightVariant === 'review_sms'
          ? 'chatbubble-ellipses-outline'
          : copy.highlightVariant === 'review_email'
            ? 'mail-outline'
            : 'information-circle-outline'
      }
      size={22}
    />
  ) : null;

  return (
    <BottomSheetModal
      fitContent
      footer={
        <View style={styles.footer}>
          <View style={styles.footerGrow}>
            <Button
              disabled={busy}
              fullWidth
              title={BOOKING_MARK_COMPLETE_CANCEL_LABEL}
              variant="secondary"
              onPress={onRequestClose}
            />
          </View>
          <View style={styles.footerGrow}>
            <Button
              disabled={!canConfirm}
              fullWidth
              loading={busy}
              title={copy.confirmLabel}
              variant="primary"
              onPress={onConfirm}
            />
          </View>
        </View>
      }
      sheetHeightPercent={50}
      title={copy.title}
      visible={visible}
      onRequestClose={onRequestClose}
    >
      {isLoadingPreview ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <View style={styles.content}>
          {previewError ? <InlineCardError message={previewError} /> : null}
          {showHighlight ? (
            <View style={styles.highlightCard}>
              <View style={styles.highlightTopRow}>
                {highlightIcon}
                <AppText style={styles.highlightTitle}>{copy.highlightTitle}</AppText>
              </View>
              {copy.highlightBody ? (
                <AppText style={styles.highlightBody}>{copy.highlightBody}</AppText>
              ) : null}
            </View>
          ) : null}
          <AppText style={styles.body}>{copy.body}</AppText>
        </View>
      )}
    </BottomSheetModal>
  );
}
