import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard, SurfaceTextField } from '../../../components/ui';
import { useTheme } from '../../../theme';
import {
  REVIEW_REPLY_BUTTON_LABEL,
  REVIEW_REPLY_CANCEL_LABEL,
  REVIEW_REPLY_COLLAPSED_MAX_CHARS,
  REVIEW_REPLY_MAX_LENGTH,
  REVIEW_REPLY_PLACEHOLDER,
  REVIEW_REPLY_SUBMIT_LABEL,
} from '../constants';
import { ReviewBodyText } from './ReviewBodyText';
import { StarRating } from './StarRating';
import { validateReviewReply } from '../utils/reviewModel';

/**
 * @param {{
 *   reviewerName: string;
 *   dateLabel: string;
 *   rating: number;
 *   body: string;
 *   reply?: string | null;
 *   isSubmittingReply?: boolean;
 *   onComposerOpen?: () => void;
 *   onComposerClose?: () => void;
 *   onReplySubmit?: (text: string) => void | Promise<void>;
 * }} props
 */
export function ReviewCard({
  reviewerName,
  dateLabel,
  rating,
  body,
  reply = null,
  isSubmittingReply = false,
  onComposerOpen,
  onComposerClose,
  onReplySubmit,
}) {
  const { colors } = useTheme();
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (reply) {
      setComposing(false);
      setDraft('');
      setSubmitError('');
      onComposerClose?.();
    }
  }, [onComposerClose, reply]);

  const canSubmit = draft.trim().length > 0 && !isSubmittingReply;
  const showReplyCharCounter = draft.length >= REVIEW_REPLY_MAX_LENGTH;

  const handleSubmit = useCallback(async () => {
    const validation = validateReviewReply(draft);
    if (!validation.ok) {
      setSubmitError(validation.message);
      return;
    }

    setSubmitError('');

    try {
      await onReplySubmit?.(validation.value);
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : 'Could not post reply.';
      setSubmitError(message);
    }
  }, [draft, onReplySubmit]);

  const handleCancel = useCallback(() => {
    setComposing(false);
    setDraft('');
    setSubmitError('');
    onComposerClose?.();
  }, [onComposerClose]);

  const openComposer = useCallback(() => {
    setComposing(true);
    onComposerOpen?.();
  }, [onComposerOpen]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'space-between',
        },
        nameBlock: {
          flex: 1,
          minWidth: 0,
        },
        name: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        date: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '500',
          letterSpacing: 0.1,
          marginTop: 2,
        },
        replyWrap: {
          flexDirection: 'row',
          marginTop: 16,
        },
        replyContent: {
          flex: 1,
          minWidth: 0,
        },
        replyBar: {
          alignSelf: 'stretch',
          backgroundColor: colors.borderStrong,
          borderRadius: 2,
          marginRight: 12,
          width: 3,
        },
        replyText: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 21,
        },
        charCounter: {
          alignSelf: 'flex-end',
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
          marginTop: 6,
        },
        charCounterAtLimit: {
          color: colors.danger,
        },
        replyLink: {
          alignSelf: 'flex-end',
          marginTop: 12,
        },
        replyLinkText: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '600',
          textDecorationLine: 'underline',
        },
        composer: {
          marginTop: 12,
        },
        composerField: {
          minHeight: 88,
        },
        composerActions: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 20,
          justifyContent: 'flex-end',
          marginTop: 10,
        },
        actionText: {
          fontSize: 14,
          fontWeight: '600',
        },
        actionMuted: {
          color: colors.textMuted,
        },
        actionPrimary: {
          color: colors.text,
        },
        actionDisabled: {
          color: colors.textMuted,
          opacity: 0.45,
        },
      }),
    [colors],
  );

  return (
    <SurfaceCard padding="md">
      <View style={styles.headerRow}>
        <View style={styles.nameBlock}>
          <AppText numberOfLines={2} style={styles.name}>
            {reviewerName}
          </AppText>
          <AppText style={styles.date}>{dateLabel}</AppText>
        </View>
        <StarRating rating={rating} size={14} gap={1} />
      </View>
      <ReviewBodyText body={body} />

      {reply ? (
        <View style={styles.replyWrap}>
          <View style={styles.replyBar} />
          <View style={styles.replyContent}>
            <ReviewBodyText
              body={reply}
              bodyStyle={styles.replyText}
              maxChars={REVIEW_REPLY_COLLAPSED_MAX_CHARS}
              showTopMargin={false}
            />
          </View>
        </View>
      ) : composing ? (
        <View style={styles.composer}>
          <SurfaceTextField
            compact
            errorText={submitError || undefined}
            maxLength={REVIEW_REPLY_MAX_LENGTH}
            multiline
            placeholder={REVIEW_REPLY_PLACEHOLDER}
            style={styles.composerField}
            textAlignVertical="top"
            value={draft}
            onChangeText={(text) => {
              setDraft(text);
              if (submitError) setSubmitError('');
            }}
            onFocus={onComposerOpen}
          />
          {showReplyCharCounter ? (
            <AppText style={[styles.charCounter, styles.charCounterAtLimit]}>
              {draft.length}/{REVIEW_REPLY_MAX_LENGTH}
            </AppText>
          ) : null}
          <View style={styles.composerActions}>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmittingReply}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={handleCancel}
            >
              <AppText style={[styles.actionText, styles.actionMuted]}>
                {REVIEW_REPLY_CANCEL_LABEL}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit }}
              disabled={!canSubmit}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                void handleSubmit();
              }}
            >
              <AppText
                style={[
                  styles.actionText,
                  canSubmit ? styles.actionPrimary : styles.actionDisabled,
                ]}
              >
                {REVIEW_REPLY_SUBMIT_LABEL}
              </AppText>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          onPress={openComposer}
          style={styles.replyLink}
        >
          <AppText style={styles.replyLinkText}>{REVIEW_REPLY_BUTTON_LABEL}</AppText>
        </Pressable>
      )}
    </SurfaceCard>
  );
}
