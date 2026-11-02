import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { GoogleMark } from './GoogleMark';
import { StarRating } from './StarRating';
import { validateReviewReply } from '../utils/reviewModel';

/**
 * @param {{
 *   reviewerName: string;
 *   dateLabel: string;
 *   rating: number;
 *   body: string;
 *   reply?: string | null;
 *   source?: 'servicelink' | 'google';
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
  source = 'servicelink',
  isSubmittingReply = false,
  onComposerOpen,
  onComposerClose,
  onReplySubmit,
}) {
  const { colors } = useTheme();
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [replyExpanded, setReplyExpanded] = useState(false);
  const replyWasPresent = useRef(Boolean(reply));

  useEffect(() => {
    if (reply) {
      setComposing(false);
      setDraft('');
      setSubmitError('');
      onComposerClose?.();
      if (!replyWasPresent.current) setReplyExpanded(true);
      replyWasPresent.current = true;
      return;
    }
    replyWasPresent.current = false;
    setReplyExpanded(false);
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
        card: {
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        headerRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'space-between',
        },
        nameBlock: {
          flex: 1,
          minWidth: 0,
        },
        name: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
        date: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '400',
          marginTop: 2,
        },
        bodyText: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 21,
          marginTop: 12,
        },
        ratingCol: {
          alignItems: 'flex-end',
          gap: 3,
          paddingTop: 2,
        },
        googleRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 4,
        },
        googleLabel: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '500',
        },
        pressed: {
          opacity: 0.72,
        },
        replyWrap: {
          flexDirection: 'row',
          marginTop: 10,
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
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 22,
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
          marginTop: 8,
        },
        replyLinkText: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '600',
          textDecorationLine: 'underline',
        },
        composer: {
          marginTop: 10,
        },
        composerField: {
          minHeight: 72,
        },
        composerActions: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 20,
          justifyContent: 'flex-end',
          marginTop: 10,
        },
        actionText: {
          fontSize: 13,
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

  const canToggleReply = Boolean(reply) && !composing;

  return (
    <SurfaceCard padding="md" style={styles.card}>
      <Pressable
        accessibilityHint={canToggleReply ? 'Shows your reply' : undefined}
        accessibilityRole={canToggleReply ? 'button' : undefined}
        accessibilityState={canToggleReply ? { expanded: replyExpanded } : undefined}
        disabled={!canToggleReply}
        onPress={() => setReplyExpanded((open) => !open)}
      >
        {({ pressed }) => (
          <View style={pressed && canToggleReply ? styles.pressed : null}>
            <View style={styles.headerRow}>
              <View style={styles.nameBlock}>
                <AppText numberOfLines={2} style={styles.name}>
                  {reviewerName}
                </AppText>
                <AppText style={styles.date}>{dateLabel}</AppText>
              </View>
              <View style={styles.ratingCol}>
                <StarRating rating={rating} size={12} gap={1} />
                {source === 'google' ? (
                  <View style={styles.googleRow}>
                    <GoogleMark size={11} />
                    <AppText style={styles.googleLabel}>Google</AppText>
                  </View>
                ) : null}
              </View>
            </View>
            {body.trim() ? <ReviewBodyText body={body} bodyStyle={styles.bodyText} /> : null}

            {reply && replyExpanded ? (
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
            ) : null}
          </View>
        )}
      </Pressable>

      {!reply && source !== 'google' ? (
        composing ? (
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
        )
      ) : null}
    </SurfaceCard>
  );
}
