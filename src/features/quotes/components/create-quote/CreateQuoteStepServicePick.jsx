import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, InlineCardError, SkeletonBox, SurfaceCard } from '../../../../components/ui';
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

/**
 * @param {{
 *   title: string;
 *   subtitle: string;
 *   icon: keyof typeof Ionicons.glyphMap;
 *   onPress: () => void;
 * }} props
 */
function PathCard({ title, subtitle, icon, onPress }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        press: {
          marginBottom: 12,
        },
        face: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 18,
          borderWidth: 1.5,
          flexDirection: 'row',
          gap: 14,
          paddingHorizontal: 16,
          paddingVertical: 18,
        },
        iconWrap: {
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
        },
        textCol: {
          flex: 1,
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '600',
          letterSpacing: -0.25,
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginTop: 4,
        },
      }),
    [colors],
  );

  return (
    <Pressable accessibilityRole="button" style={styles.press} onPress={onPress}>
      <View style={styles.face}>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.textMuted} name={icon} size={24} />
        </View>
        <View style={styles.textCol}>
          <AppText style={styles.title}>{title}</AppText>
          <AppText style={styles.subtitle}>{subtitle}</AppText>
        </View>
        <Ionicons color={colors.textMuted} name="chevron-forward" size={22} />
      </View>
    </Pressable>
  );
}

function ServiceListSkeleton({ showCategoryTabs = false }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          gap: 8,
          marginBottom: 14,
        },
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

  const card = (
    <SurfaceCard outlined={false} padding="none" style={styles.card}>
      <SkeletonBox borderRadius={8} height={18} pulse width="48%" />
      <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 10 }} width="36%" />
      <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 12 }} width="55%" />
    </SurfaceCard>
  );

  return (
    <>
      {showCategoryTabs ? (
        <View style={styles.row}>
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
      ) : null}
      {card}
      {card}
    </>
  );
}

/**
 * @param {{
 *   phase: 'chooser' | 'catalog';
 *   categories?: { id: string; name: string }[];
 *   services: object[];
 *   selectedServiceId: string | null;
 *   isLoading?: boolean;
 *   catalogError?: string | null;
 *   onChooseYourServices: () => void;
 *   onChooseCustomJob: () => void;
 *   onSelectCatalogService: (id: string) => void;
 * }} props
 */
export function CreateQuoteStepServicePick({
  phase,
  categories = [],
  services,
  selectedServiceId,
  isLoading = false,
  catalogError = null,
  onChooseYourServices,
  onChooseCustomJob,
  onSelectCatalogService,
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
    if (!showCategoryTabs) return services;
    return filterBookingLinkServicesByCategory(services, selectedCategoryTabId);
  }, [selectedCategoryTabId, services, showCategoryTabs]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        filtersBleed: {
          marginHorizontal: -SCREEN_GUTTER,
        },
        empty: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
        },
        errorWrap: {
          marginBottom: 12,
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
          onPress={() => onSelectCatalogService(svc.id)}
        />
      );
    },
    [onSelectCatalogService, selectedServiceId],
  );

  if (phase === 'catalog') {
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
        {visibleServices.length > 0 ? (
          visibleServices.map((svc) => renderServiceCard(svc))
        ) : (
          <AppText style={styles.empty}>
            {services.length === 0
              ? 'No active services yet. Add some in Services, or go back and choose a custom job.'
              : 'No services in this category.'}
          </AppText>
        )}
      </View>
    );
  }

  return (
    <View>
      <PathCard
        icon="grid-outline"
        subtitle="Choose something you already offer."
        title="Your services"
        onPress={onChooseYourServices}
      />
      <PathCard
        icon="create-outline"
        subtitle="Name the work and set your own price."
        title="Custom job"
        onPress={onChooseCustomJob}
      />
    </View>
  );
}
