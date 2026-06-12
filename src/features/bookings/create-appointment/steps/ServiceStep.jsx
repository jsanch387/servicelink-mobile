import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, InlineCardError, SkeletonBox } from '../../../../components/ui';
import {
  ServiceCategoryTabs,
  shouldShowCategoryTabs,
  useServiceCategoryTabs,
} from '../../../services/categories';
import { ChoiceRow } from '../components/ChoiceRow';
import { useTheme } from '../../../../theme';

function ServiceListSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          marginBottom: 10,
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
      }),
    [colors],
  );

  return (
    <>
      {[0, 1, 2, 4].map((key) => (
        <View key={key} style={styles.row}>
          <SkeletonBox borderRadius={8} height={18} pulse width="62%" />
        </View>
      ))}
    </>
  );
}

/**
 * @param {object} props
 * @param {string | null | undefined} props.catalogError
 * @param {boolean} props.isLoading
 * @param {Array<{ id: string; name: string; priceLabel?: string }>} props.services
 * @param {Array<{ id: string; name: string }>} [props.categories]
 * @param {Record<string, string | undefined>} [props.serviceCategoryById]
 * @param {string | null | undefined} props.selectedServiceId
 * @param {(id: string) => void} props.onSelectServiceId
 */
export function ServiceStep({
  catalogError,
  isLoading,
  services,
  categories = [],
  serviceCategoryById = {},
  selectedServiceId,
  onSelectServiceId,
}) {
  const { colors } = useTheme();

  const categoryTabsEnabled = useMemo(
    () =>
      shouldShowCategoryTabs({
        categories,
        services,
        serviceCategoryById,
      }),
    [categories, serviceCategoryById, services],
  );

  const {
    tabs: serviceCategoryTabs,
    selectedTabId: selectedServiceCategoryTabId,
    setSelectedTabId: setSelectedServiceCategoryTabId,
    visibleServices,
  } = useServiceCategoryTabs({
    enabled: categoryTabsEnabled,
    services,
    categories,
    serviceCategoryById,
  });

  const listServices = categoryTabsEnabled ? visibleServices : services;

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
      }),
    [colors],
  );

  if (catalogError) {
    return (
      <View style={styles.errorWrap}>
        <InlineCardError message={catalogError} />
      </View>
    );
  }

  if (isLoading) {
    return <ServiceListSkeleton />;
  }

  if (!services.length) {
    return (
      <AppText style={styles.empty}>
        No active services yet. Add services in the Services tab.
      </AppText>
    );
  }

  return (
    <View>
      {categoryTabsEnabled && serviceCategoryTabs ? (
        <ServiceCategoryTabs
          onSelectTab={setSelectedServiceCategoryTabId}
          selectedTabId={selectedServiceCategoryTabId}
          tabs={serviceCategoryTabs}
        />
      ) : null}

      {!listServices.length ? (
        <AppText style={styles.empty}>No services in this category.</AppText>
      ) : (
        listServices.map((svc) => (
          <ChoiceRow
            key={svc.id}
            rightLabel={svc.priceLabel ?? undefined}
            selected={selectedServiceId === svc.id}
            title={svc.name}
            onPress={() => onSelectServiceId(svc.id)}
          />
        ))
      )}
    </View>
  );
}
