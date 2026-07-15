import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  InlineCardError,
  ServicePathChooser,
  SkeletonBox,
  SurfaceCard,
} from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { BOOKING_LINK_ALL_CATEGORY_ID } from '../../../bookingLink/constants/bookingLinkServiceCategories';
import { BookingLinkServiceCategoryFilters } from '../../../bookingLink/preview/components/BookingLinkServiceCategoryFilters';
import {
  buildBookingLinkCategoryFilterTabs,
  filterBookingLinkServicesByCategory,
  shouldShowBookingLinkCategoryFilters,
} from '../../../bookingLink/preview/utils/bookingLinkServiceCategoryPreview';
import { ServicePreviewCard } from '../../../services/components/ServicePreviewCard';
import { mapCatalogServiceToPreviewCard } from '../../../services/utils/mapCatalogServiceToPreviewCard';
import { useTheme } from '../../../../theme';

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
  },
});

function ServiceListSkeleton({ showCategoryTabs = false }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 18,
          borderWidth: 1,
          marginBottom: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
      }),
    [colors],
  );

  const cardSkeleton = (
    <SurfaceCard outlined={false} padding="none" style={styles.card}>
      <SkeletonBox borderRadius={8} height={18} pulse width="48%" />
      <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 10 }} width="36%" />
      <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 12 }} width="55%" />
    </SurfaceCard>
  );

  return (
    <>
      {showCategoryTabs ? <CategoryFilterSkeleton /> : null}
      {cardSkeleton}
      {cardSkeleton}
    </>
  );
}

export function ServiceStep({
  phase = 'chooser',
  catalogError,
  categories = [],
  isLoading,
  services,
  selectedServiceId,
  onChooseServices,
  onChooseCustomJob,
  onSelectServiceId,
}) {
  const { colors } = useTheme();
  const [selectedCategoryTabId, setSelectedCategoryTabId] = useState(BOOKING_LINK_ALL_CATEGORY_ID);

  const showCategoryTabs = shouldShowBookingLinkCategoryFilters(categories, services);

  const categoryFilterTabs = useMemo(
    () => buildBookingLinkCategoryFilterTabs(categories, services),
    [categories, services],
  );

  useEffect(() => {
    setSelectedCategoryTabId(BOOKING_LINK_ALL_CATEGORY_ID);
  }, [categories, services]);

  const visibleServices = useMemo(() => {
    if (!showCategoryTabs) {
      return services;
    }
    return filterBookingLinkServicesByCategory(services, selectedCategoryTabId);
  }, [selectedCategoryTabId, services, showCategoryTabs]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        empty: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
        },
        errorWrap: {
          marginBottom: 12,
        },
        filtersBleed: {
          marginHorizontal: -SCREEN_GUTTER,
        },
        servicesList: {
          rowGap: 0,
        },
      }),
    [colors],
  );

  const renderServiceCard = useCallback(
    (svc) => {
      const card = mapCatalogServiceToPreviewCard(svc);
      return (
        <ServicePreviewCard
          hideDescription
          key={svc.id}
          selected={selectedServiceId === svc.id}
          service={card}
          onPress={() => onSelectServiceId(svc.id)}
        />
      );
    },
    [onSelectServiceId, selectedServiceId],
  );

  if (phase === 'chooser') {
    return (
      <ServicePathChooser
        onChooseCustomJob={onChooseCustomJob}
        onChooseServices={onChooseServices}
      />
    );
  }

  if (catalogError) {
    return (
      <View style={styles.errorWrap}>
        <InlineCardError message={catalogError} />
      </View>
    );
  }

  if (isLoading) {
    return <ServiceListSkeleton showCategoryTabs={categories.length > 0} />;
  }

  if (!services.length) {
    return (
      <AppText style={styles.empty}>
        No active services yet. Add some in Services, or go back and choose a custom job.
      </AppText>
    );
  }

  return (
    <View>
      {showCategoryTabs && categoryFilterTabs ? (
        <View style={styles.filtersBleed}>
          <BookingLinkServiceCategoryFilters
            selectedTabId={selectedCategoryTabId}
            tabs={categoryFilterTabs}
            onSelectTab={setSelectedCategoryTabId}
          />
        </View>
      ) : null}

      <View style={styles.servicesList}>
        {visibleServices.length > 0 ? (
          visibleServices.map((svc) => renderServiceCard(svc))
        ) : (
          <AppText style={styles.empty}>No services in this category.</AppText>
        )}
      </View>
    </View>
  );
}
