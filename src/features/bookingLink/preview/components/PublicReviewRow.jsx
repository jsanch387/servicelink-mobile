import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { REVIEW_REPLY_COLLAPSED_MAX_CHARS } from '../../../reviews/constants';
import { ReviewBodyText } from '../../../reviews/components/ReviewBodyText';
import { StarRating } from '../../../reviews/components/StarRating';

/**
 * Read-only public review row — flat layout (no card) for booking-link preview.
 *
 * @param {{
 *   authorDisplayName: string;
 *   dateLabel: string;
 *   rating: number;
 *   body: string;
 *   ownerReplyBody?: string | null;
 * }} props
 */
export function PublicReviewRow({
  authorDisplayName,
  dateLabel,
  rating,
  body,
  ownerReplyBody = null,
}) {
  const { colors } = useTheme();

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
        bodyText: {
          color: colors.textSecondary,
        },
        replyWrap: {
          flexDirection: 'row',
          marginTop: 14,
        },
        replyBar: {
          alignSelf: 'stretch',
          backgroundColor: colors.borderStrong,
          borderRadius: 2,
          marginRight: 12,
          width: 3,
        },
        replyContent: {
          flex: 1,
          minWidth: 0,
        },
        replyText: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 21,
        },
      }),
    [colors],
  );

  return (
    <View>
      <View style={styles.headerRow}>
        <View style={styles.nameBlock}>
          <AppText numberOfLines={2} style={styles.name}>
            {authorDisplayName}
          </AppText>
          <AppText style={styles.date}>{dateLabel}</AppText>
        </View>
        <StarRating rating={rating} size={14} gap={1} />
      </View>

      <ReviewBodyText body={body} bodyStyle={styles.bodyText} />

      {ownerReplyBody ? (
        <View style={styles.replyWrap}>
          <View style={styles.replyBar} />
          <View style={styles.replyContent}>
            <ReviewBodyText
              body={ownerReplyBody}
              bodyStyle={styles.replyText}
              maxChars={REVIEW_REPLY_COLLAPSED_MAX_CHARS}
              showTopMargin={false}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
