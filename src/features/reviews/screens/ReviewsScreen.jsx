import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, FilterPills } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { ReviewCard } from '../components/ReviewCard';
import { ReviewsHowItWorks } from '../components/ReviewsHowItWorks';
import { ReviewsSummaryCard } from '../components/ReviewsSummaryCard';
import {
  REVIEWS_FILTER_NEEDS_REPLY,
  REVIEWS_FILTER_OPTIONS,
  REVIEWS_FILTER_REPLIED,
  REVIEWS_PREVIEW_REVIEWS,
  REVIEWS_PREVIEW_SUMMARY,
} from '../constants';
import { filterPreviewReviews } from '../utils/filterPreviewReviews';

export function ReviewsScreen() {
  const { colors } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const [filterKey, setFilterKey] = useState(REVIEWS_FILTER_OPTIONS[0].key);
  const [reviews, setReviews] = useState(() =>
    REVIEWS_PREVIEW_REVIEWS.map((review) => ({ ...review })),
  );

  const handleReplySubmit = useCallback((reviewId, replyText) => {
    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId
          ? { ...review, reply: replyText, replyStatus: REVIEWS_FILTER_REPLIED }
          : review,
      ),
    );
  }, []);

  const filteredReviews = useMemo(
    () => filterPreviewReviews(reviews, filterKey),
    [filterKey, reviews],
  );

  const totalCount = reviews.length;
  const showingCount = filteredReviews.length;

  const countLabel = useMemo(() => {
    if (totalCount === 0) return 'No reviews yet';
    return `Showing ${showingCount} of ${totalCount} review${totalCount === 1 ? '' : 's'}`;
  }, [showingCount, totalCount]);

  const emptyFilterCopy = useMemo(() => {
    if (filterKey === REVIEWS_FILTER_NEEDS_REPLY) {
      return {
        title: 'No reviews need a reply',
        body: 'When a customer leaves a review without a response, it will show up here.',
      };
    }
    if (filterKey === REVIEWS_FILTER_REPLIED) {
      return {
        title: 'No replied reviews yet',
        body: 'Reviews you have responded to will appear in this list.',
      };
    }
    return null;
  }, [filterKey]);

  const scrollBottomPad = 28 + Math.max(tabBarHeight, 72);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        scroll: {
          flex: 1,
        },
        content: {
          gap: 16,
          paddingBottom: scrollBottomPad,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 8,
        },
        filtersBlock: {
          gap: 10,
        },
        count: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
        },
        list: {
          gap: 12,
        },
        emptyWrap: {
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 32,
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
      }),
    [colors, scrollBottomPad],
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <ReviewsHowItWorks />

        <ReviewsSummaryCard
          averageRating={REVIEWS_PREVIEW_SUMMARY.averageRating}
          breakdown={REVIEWS_PREVIEW_SUMMARY.breakdown}
          totalCount={REVIEWS_PREVIEW_SUMMARY.totalCount}
        />

        <View style={styles.filtersBlock}>
          <FilterPills
            options={REVIEWS_FILTER_OPTIONS}
            selectedKey={filterKey}
            onSelect={setFilterKey}
          />
          <AppText style={styles.count}>{countLabel}</AppText>
        </View>

        {filteredReviews.length > 0 ? (
          <View style={styles.list}>
            {filteredReviews.map((review) => (
              <ReviewCard
                body={review.body}
                dateLabel={review.dateLabel}
                key={review.id}
                rating={review.rating}
                reply={review.reply}
                reviewerName={review.reviewerName}
                onReplySubmit={(text) => handleReplySubmit(review.id, text)}
              />
            ))}
          </View>
        ) : emptyFilterCopy ? (
          <View style={styles.emptyWrap}>
            <AppText style={styles.emptyTitle}>{emptyFilterCopy.title}</AppText>
            <AppText style={styles.emptyBody}>{emptyFilterCopy.body}</AppText>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
