import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';
import { useBookingLinkPublicReviews } from '../hooks/useBookingLinkPublicReviews';
import { BioTabContent } from './components/BioTabContent';
import { BookingLinkTabs } from './components/BookingLinkTabs';
import { BookingProfileHeader } from './components/BookingProfileHeader';
import { GalleryTabContent } from './components/GalleryTabContent';
import { PublicActiveSaleMarqueeBanner } from './components/PublicActiveSaleMarqueeBanner';
import { ReviewsTabContent } from './components/ReviewsTabContent';
import { ServicesTabContent } from './components/ServicesTabContent';
import {
  BOOKING_LINK_TAB_BIO,
  BOOKING_LINK_TAB_GALLERY,
  BOOKING_LINK_TAB_REVIEWS,
  BOOKING_LINK_TAB_SERVICES,
} from '../constants/bookingLinkPreviewTabs';
import { mapSaleToMarqueeBanner } from './utils/mapSaleToMarqueeBanner';

const FAB_CLEARANCE = 56 + 28;

/**
 * Read-only booking-link profile: header, tabs, tab panels.
 * Edit FAB is rendered by {@link ../screens/BookingLinkScreen} as a sibling (same pattern as home + FloatingCreateMenu).
 */
export function BookingLinkPreview({
  activeTab,
  onChangeTab,
  /** TanStack-style flags + optional `error` for the services tab. */
  queryState,
  onRefresh,
  coverHeight,
  businessName,
  businessType,
  location,
  phoneNumber,
  showRequestQuoteCta,
  socialMedia,
  coverImageUrl,
  logoUrl,
  showVerifiedBadge,
  services,
  serviceCategories = [],
  galleryImages,
  bio,
  businessId,
  /** Active marketing sale for today (optional). */
  activeSale = null,
}) {
  const { colors } = useTheme();
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const reviewsState = useBookingLinkPublicReviews(businessId, Boolean(businessId));
  const headerAverageRating =
    reviewsState.summary.totalCount > 0 ? reviewsState.summary.averageRating : null;
  const marqueeSale = useMemo(() => mapSaleToMarqueeBanner(activeSale), [activeSale]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        scrollContent: {
          paddingBottom: FAB_CLEARANCE,
        },
      }),
    [colors],
  );

  /** Only user pull — background refetch (e.g. screen focus) sets `isFetching` and would flash the native spinner. */
  const handleUserRefresh = useCallback(() => {
    if (!onRefresh) {
      return;
    }
    setPullRefreshing(true);
    void Promise.resolve(onRefresh())
      .catch(() => {})
      .finally(() => {
        setPullRefreshing(false);
      });
  }, [onRefresh]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          colors={[colors.accent]}
          onRefresh={handleUserRefresh}
          refreshing={pullRefreshing}
          tintColor={colors.accent}
        />
      }
      showsVerticalScrollIndicator={false}
      style={styles.root}
    >
      {marqueeSale ? <PublicActiveSaleMarqueeBanner sale={marqueeSale} /> : null}
      <BookingProfileHeader
        averageRating={headerAverageRating}
        businessName={businessName}
        coverHeight={coverHeight}
        coverImageUrl={coverImageUrl}
        isLoading={false}
        location={location}
        logoUrl={logoUrl}
        phoneNumber={phoneNumber}
        showRequestQuoteCta={showRequestQuoteCta}
        showVerifiedBadge={showVerifiedBadge}
        socialMedia={socialMedia}
      />
      <BookingLinkTabs activeTab={activeTab} onChangeTab={onChangeTab} />
      {activeTab === BOOKING_LINK_TAB_SERVICES ? (
        <ServicesTabContent
          error={queryState.error}
          isLoading={false}
          serviceCategories={serviceCategories}
          services={services}
        />
      ) : null}
      {activeTab === BOOKING_LINK_TAB_GALLERY ? <GalleryTabContent images={galleryImages} /> : null}
      {activeTab === BOOKING_LINK_TAB_BIO ? (
        <BioTabContent bio={bio} businessType={businessType} />
      ) : null}
      {activeTab === BOOKING_LINK_TAB_REVIEWS ? (
        <ReviewsTabContent
          isActive={activeTab === BOOKING_LINK_TAB_REVIEWS}
          reviewsState={reviewsState}
        />
      ) : null}
    </ScrollView>
  );
}
