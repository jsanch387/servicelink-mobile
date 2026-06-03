import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, InlineCardError } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { useTheme } from '../../../../theme';
import { BOOKING_LINK_REVIEWS_EMPTY_COPY } from '../../constants/bookingLinkReviewsCopy';
import { ReviewsSummarySection } from '../../../reviews/components/ReviewsSummarySection';
import { PublicReviewRow } from './PublicReviewRow';
import { ReviewsTabSkeleton } from './ReviewsTabSkeleton';

/**
 * Read-only public reviews for the booking-link preview.
 *
 * @param {{ isActive: boolean; reviewsState: ReturnType<typeof import('../../hooks/useBookingLinkPublicReviews').useBookingLinkPublicReviews> }} props
 */
export function ReviewsTabContent({ isActive, reviewsState }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingBottom: 28,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 24,
        },
        divider: {
          backgroundColor: colors.border,
          height: 1,
          marginBottom: 16,
          marginHorizontal: -SCREEN_GUTTER,
          marginTop: 20,
        },
        emptyWrap: {
          alignItems: 'center',
          paddingBottom: 28,
          paddingHorizontal: 12,
          paddingTop: 8,
        },
        emptyTitle: {
          color: colors.textSecondary,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.15,
          textAlign: 'center',
        },
        emptyBody: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginTop: 8,
          textAlign: 'center',
        },
        errorWrap: {
          marginBottom: 12,
        },
      }),
    [colors],
  );

  if (!isActive) {
    return null;
  }

  if (reviewsState.isLoading) {
    return (
      <View style={styles.wrap}>
        <ReviewsTabSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {reviewsState.error ? (
        <View style={styles.errorWrap}>
          <InlineCardError message={reviewsState.error} />
        </View>
      ) : null}

      {!reviewsState.error ? (
        reviewsState.reviews.length > 0 ? (
          <>
            <ReviewsSummarySection
              averageRating={reviewsState.summary.averageRating}
              breakdown={reviewsState.summary.breakdown}
              showBreakdownDivider={false}
              totalCount={reviewsState.summary.totalCount}
            />
            <View style={styles.divider} />
            {reviewsState.reviews.map((review, index) => (
              <View key={review.id}>
                <PublicReviewRow
                  authorDisplayName={review.authorDisplayName}
                  body={review.body}
                  dateLabel={review.dateLabel}
                  ownerReplyBody={review.ownerReply?.body ?? null}
                  rating={review.rating}
                />
                {index < reviewsState.reviews.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyWrap}>
            <AppText style={styles.emptyTitle}>{BOOKING_LINK_REVIEWS_EMPTY_COPY.title}</AppText>
            <AppText style={styles.emptyBody}>{BOOKING_LINK_REVIEWS_EMPTY_COPY.body}</AppText>
          </View>
        )
      ) : null}
    </View>
  );
}
