import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, FilterPills, InlineCardError, SurfaceCard } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import { ReviewCard } from '../components/ReviewCard';
import { ReviewsEmptyState } from '../components/ReviewsEmptyState';
import { ReviewsHowItWorks } from '../components/ReviewsHowItWorks';
import { ReviewsListSkeleton } from '../components/ReviewsListSkeleton';
import { ReviewsSummaryCard } from '../components/ReviewsSummaryCard';
import {
  REVIEWS_EMPTY_STATE_COPY,
  REVIEWS_FILTER_NEEDS_REPLY,
  REVIEWS_FILTER_OPTIONS,
} from '../constants';
import { useReviewsInbox } from '../hooks/useReviewsInbox';
import { useSubmitReviewReply } from '../hooks/useSubmitReviewReply';
import { filterReviews } from '../utils/filterReviews';

const KEYBOARD_SCROLL_INSET = 24;
const IOS_KEYBOARD_VERTICAL_OFFSET = 88;

export function ReviewsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const userId = user?.id;
  const tabBarHeight = useBottomTabBarHeight();
  const inbox = useReviewsInbox();
  const submitReply = useSubmitReviewReply(inbox.business?.id);
  const [filterKey, setFilterKey] = useState(REVIEWS_FILTER_OPTIONS[0].key);
  const [submittingReviewId, setSubmittingReviewId] = useState(/** @type {string | null} */ (null));
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollRef = useRef(/** @type {ScrollView | null} */ (null));
  const listOffsetRef = useRef(0);
  const cardOffsetRef = useRef(/** @type {Record<string, number>} */ ({}));
  const composingReviewIdRef = useRef(/** @type {string | null} */ (null));

  const filteredReviews = useMemo(
    () => filterReviews(inbox.reviews, filterKey),
    [filterKey, inbox.reviews],
  );

  const totalCount = inbox.reviews.length;
  const showingCount = filteredReviews.length;
  const hasReviews = totalCount > 0;

  const showBusinessMissing =
    !inbox.isLoading && !inbox.businessError && Boolean(userId) && !inbox.business?.id;

  const countLabel = useMemo(() => {
    if (totalCount === 0) return REVIEWS_EMPTY_STATE_COPY.title;
    return `Showing ${showingCount} of ${totalCount} review${totalCount === 1 ? '' : 's'}`;
  }, [showingCount, totalCount]);

  const emptyFilterCopy = useMemo(() => {
    if (!hasReviews) return null;
    if (filterKey === REVIEWS_FILTER_NEEDS_REPLY) {
      return {
        title: 'No reviews need a reply',
        body: 'When a customer leaves a review without a response, it will show up here.',
      };
    }
    return null;
  }, [filterKey, hasReviews]);

  const scrollToReviewComposer = useCallback((reviewId) => {
    const cardOffset = cardOffsetRef.current[reviewId];
    if (cardOffset == null) return;

    const targetY = Math.max(0, listOffsetRef.current + cardOffset - KEYBOARD_SCROLL_INSET);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ animated: true, y: targetY });
    });
  }, []);

  const handleComposerOpen = useCallback(
    (reviewId) => {
      composingReviewIdRef.current = reviewId;
      scrollToReviewComposer(reviewId);
      if (Platform.OS === 'ios') {
        setTimeout(() => scrollToReviewComposer(reviewId), 250);
      }
    },
    [scrollToReviewComposer],
  );

  const handleComposerClose = useCallback(() => {
    composingReviewIdRef.current = null;
  }, []);

  const handleReplySubmit = useCallback(
    async (reviewId, replyText) => {
      setSubmittingReviewId(reviewId);
      try {
        await submitReply.mutateAsync({ reviewId, replyText });
      } finally {
        setSubmittingReviewId(null);
      }
    },
    [submitReply],
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      const activeReviewId = composingReviewIdRef.current;
      if (activeReviewId) {
        scrollToReviewComposer(activeReviewId);
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToReviewComposer]);

  const scrollBottomPad = 28 + Math.max(tabBarHeight, 72) + keyboardHeight;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        flex: {
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
        howItWorksBlock: {
          marginTop: -4,
        },
        errorBlock: {
          marginBottom: 4,
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? IOS_KEYBOARD_VERTICAL_OFFSET : 0}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollRef}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={styles.content}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              colors={[colors.accent]}
              onRefresh={() => void inbox.refetch()}
              refreshing={inbox.isFetching && !inbox.isLoading}
              tintColor={colors.accent}
            />
          }
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          {inbox.businessError ? (
            <View style={styles.errorBlock}>
              <SurfaceCard padding="md">
                <InlineCardError message={inbox.businessError} />
              </SurfaceCard>
            </View>
          ) : null}

          {inbox.listError ? (
            <View style={styles.errorBlock}>
              <SurfaceCard padding="md">
                <InlineCardError message={inbox.listError} />
              </SurfaceCard>
            </View>
          ) : null}

          {inbox.isLoading ? (
            <ReviewsListSkeleton />
          ) : (
            <>
              <ReviewsSummaryCard
                averageRating={inbox.summary.averageRating}
                breakdown={inbox.summary.breakdown}
                totalCount={inbox.summary.totalCount}
              />

              <View style={styles.howItWorksBlock}>
                <ReviewsHowItWorks />
              </View>

              {hasReviews ? (
                <View style={styles.filtersBlock}>
                  <FilterPills
                    options={REVIEWS_FILTER_OPTIONS}
                    selectedKey={filterKey}
                    onSelect={setFilterKey}
                  />
                  <AppText style={styles.count}>{countLabel}</AppText>
                </View>
              ) : null}

              {showBusinessMissing ? (
                <View style={styles.emptyWrap}>
                  <AppText style={styles.emptyTitle}>Business profile not found</AppText>
                  <AppText style={styles.emptyBody}>
                    Finish onboarding on this account so we can load reviews.
                  </AppText>
                </View>
              ) : inbox.listError ? null : !hasReviews ? (
                <ReviewsEmptyState />
              ) : filteredReviews.length > 0 ? (
                <View
                  onLayout={(event) => {
                    listOffsetRef.current = event.nativeEvent.layout.y;
                  }}
                  style={styles.list}
                >
                  {filteredReviews.map((review) => (
                    <View
                      key={review.id}
                      onLayout={(event) => {
                        cardOffsetRef.current[review.id] = event.nativeEvent.layout.y;
                      }}
                    >
                      <ReviewCard
                        body={review.body}
                        dateLabel={review.dateLabel}
                        isSubmittingReply={submittingReviewId === review.id}
                        rating={review.rating}
                        reply={review.ownerReply?.body ?? null}
                        reviewerName={review.authorDisplayName}
                        onComposerClose={handleComposerClose}
                        onComposerOpen={() => handleComposerOpen(review.id)}
                        onReplySubmit={(text) => handleReplySubmit(review.id, text)}
                      />
                    </View>
                  ))}
                </View>
              ) : emptyFilterCopy ? (
                <View style={styles.emptyWrap}>
                  <AppText style={styles.emptyTitle}>{emptyFilterCopy.title}</AppText>
                  <AppText style={styles.emptyBody}>{emptyFilterCopy.body}</AppText>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
