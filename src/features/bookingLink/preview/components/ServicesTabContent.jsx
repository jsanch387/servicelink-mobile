import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, InlineCardError, SkeletonBox, SurfaceCard } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { ServicePreviewCard } from '../../../services/components/ServicePreviewCard';
import { useTheme } from '../../../../theme';
import { BOOKING_LINK_ALL_CATEGORY_ID } from '../../constants/bookingLinkServiceCategories';
import {
  buildBookingLinkCategoryFilterTabs,
  filterBookingLinkServicesByCategory,
  shouldShowBookingLinkCategoryFilters,
} from '../utils/bookingLinkServiceCategoryPreview';
import { BookingLinkServiceCategoryFilters } from './BookingLinkServiceCategoryFilters';

function CategoryFilterSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={filterSkeletonStyles.row}>
      {[72, 88, 64].map((width) => (
        <SkeletonBox
          key={width}
          borderRadius={10}
          height={36}
          pulse
          style={{ backgroundColor: colors.cardSurface }}
          width={width}
        />
      ))}
    </View>
  );
}

const filterSkeletonStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    paddingHorizontal: SCREEN_GUTTER,
  },
});

export function ServicesTabContent({ services, serviceCategories = [], isLoading, error }) {
  const { colors } = useTheme();
  const [selectedCategoryTabId, setSelectedCategoryTabId] = useState(BOOKING_LINK_ALL_CATEGORY_ID);

  const showCategoryFilters = shouldShowBookingLinkCategoryFilters(serviceCategories, services);

  const categoryFilterTabs = useMemo(
    () => buildBookingLinkCategoryFilterTabs(serviceCategories, services),
    [serviceCategories, services],
  );

  useEffect(() => {
    setSelectedCategoryTabId(BOOKING_LINK_ALL_CATEGORY_ID);
  }, [serviceCategories, services]);

  const visibleServices = useMemo(() => {
    if (!showCategoryFilters) return services;
    return filterBookingLinkServicesByCategory(services, selectedCategoryTabId);
  }, [selectedCategoryTabId, services, showCategoryFilters]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingBottom: 28,
          paddingTop: 16,
        },
        cardsGutter: {
          paddingHorizontal: SCREEN_GUTTER,
        },
        profileErrorWrap: {
          marginBottom: 12,
        },
        serviceCard: {
          borderRadius: 18,
          marginBottom: 12,
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        emptyStateText: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      {isLoading && showCategoryFilters ? <CategoryFilterSkeleton /> : null}

      {!isLoading && showCategoryFilters && categoryFilterTabs ? (
        <BookingLinkServiceCategoryFilters
          selectedTabId={selectedCategoryTabId}
          tabs={categoryFilterTabs}
          onSelectTab={setSelectedCategoryTabId}
        />
      ) : null}

      <View style={styles.cardsGutter}>
        {error ? (
          <View style={styles.profileErrorWrap}>
            <InlineCardError message={error} />
          </View>
        ) : null}

        {isLoading ? (
          <>
            <SurfaceCard outlined={false} padding="none" style={styles.serviceCard}>
              <SkeletonBox borderRadius={8} height={18} pulse width="48%" />
              <SkeletonBox
                borderRadius={8}
                height={14}
                pulse
                style={{ marginTop: 10 }}
                width="36%"
              />
              <SkeletonBox
                borderRadius={8}
                height={14}
                pulse
                style={{ marginTop: 12 }}
                width="88%"
              />
              <SkeletonBox
                borderRadius={8}
                height={14}
                pulse
                style={{ marginTop: 8 }}
                width="72%"
              />
              <SkeletonBox
                borderRadius={12}
                height={42}
                pulse
                style={{ marginTop: 18 }}
                width="100%"
              />
            </SurfaceCard>
            <SurfaceCard outlined={false} padding="none" style={styles.serviceCard}>
              <SkeletonBox borderRadius={8} height={18} pulse width="48%" />
              <SkeletonBox
                borderRadius={8}
                height={14}
                pulse
                style={{ marginTop: 10 }}
                width="36%"
              />
              <SkeletonBox
                borderRadius={8}
                height={14}
                pulse
                style={{ marginTop: 12 }}
                width="88%"
              />
              <SkeletonBox
                borderRadius={8}
                height={14}
                pulse
                style={{ marginTop: 8 }}
                width="72%"
              />
              <SkeletonBox
                borderRadius={12}
                height={42}
                pulse
                style={{ marginTop: 18 }}
                width="100%"
              />
            </SurfaceCard>
          </>
        ) : null}

        {!isLoading && services.length === 0 ? (
          <SurfaceCard outlined={false} padding="none" style={styles.serviceCard}>
            <AppText style={styles.emptyStateText}>No active services yet.</AppText>
          </SurfaceCard>
        ) : null}

        {!isLoading && services.length > 0 && visibleServices.length === 0 ? (
          <SurfaceCard outlined={false} padding="none" style={styles.serviceCard}>
            <AppText style={styles.emptyStateText}>No services in this group yet.</AppText>
          </SurfaceCard>
        ) : null}

        {!isLoading
          ? visibleServices.map((service) => (
              <ServicePreviewCard key={service.id} service={service} />
            ))
          : null}
      </View>
    </View>
  );
}
