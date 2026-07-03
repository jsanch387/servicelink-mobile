import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, InlineCardError, SkeletonBox, SurfaceCard } from '../../../components/ui';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { FREE_TIER_MAX_SERVICES, freeTierServicesLimitCopy } from '../constants/freeTierLimits';
import { showWebAccountFeatureAlert, useSubscription } from '../../subscription';
import { getWebAccountAdminUrl } from '../../../lib/webAppOrigin';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { useAuth } from '../../auth';
import {
  CategoryEditorSheet,
  ServiceCategoryTabs,
  ServiceCatalogMetaRow,
  ServiceReorderBottomBar,
  ServiceReorderHeaderBlock,
  UNCATEGORIZED_SERVICES_GROUP_ID,
  buildDeleteCategoryAlertContent,
  countServicesAssignedToCategory,
  getServicesForCategoryTab,
  hasCategoryOrderChanges,
  hasOrderChangesWithinTab,
  isUncategorizedTabId,
  mergeServicesOrderWithinTab,
  shouldShowCategoryTabs,
  useMutateServiceCategory,
  useSaveServiceCategoriesOrder,
  useServiceCategoryTabs,
  withCategoryServiceCounts,
  ServiceCategoriesHowItWorksSheet,
  SERVICE_CATEGORIES_HOW_IT_WORKS_TAB_LINK_LABEL,
} from '../categories';
import { AddServiceFab } from '../components/AddServiceFab';
import { AddCategoryFab } from '../components/AddCategoryFab';
import { AddAddonFab } from '../components/AddAddonFab';
import { AddonEditorSheet } from '../components/AddonEditorSheet';
import { CatalogEntityCard } from '../components/CatalogEntityCard';
import { CatalogHowItWorksLink } from '../components/CatalogHowItWorksLink';
import { ServiceAddonsHowItWorksSheet } from '../components/ServiceAddonsHowItWorksSheet';
import { ServiceCreateSheet } from '../components/ServiceCreateSheet';
import { SERVICE_ADDONS_HOW_IT_WORKS_LINK_LABEL } from '../constants/serviceAddonsHowItWorksCopy';
import {
  ENTITY_VIEW_ADDONS,
  ENTITY_VIEW_CATEGORIES,
  ENTITY_VIEW_SERVICES,
  SegmentedEntityToggle,
} from '../components/SegmentedEntityToggle';
import { ServiceEntityCard } from '../components/ServiceEntityCard';
import { useCreateBusinessService } from '../hooks/useCreateBusinessService';
import { useDeleteBusinessService } from '../hooks/useDeleteBusinessService';
import { useDeleteServiceAddon } from '../hooks/useDeleteServiceAddon';
import { useMutateServiceAddon } from '../hooks/useMutateServiceAddon';
import { useSaveBusinessServicesOrder } from '../hooks/useSaveBusinessServicesOrder';
import { useServicesCatalog } from '../hooks/useServicesCatalog';
import { useUpdateBusinessServiceActive } from '../hooks/useUpdateBusinessServiceActive';
import { normalizeAddonDurationLabelForCard } from '../utils/buildServicesCatalogModel';
import { normalizeAddonDurationHHmm } from '../utils/serviceAddonModel';

const SERVICES_FAB_BOTTOM = 30;
const SERVICES_LIST_BOTTOM_PADDING = 36;
const SERVICES_LIST_BOTTOM_PADDING_WITH_FAB = 112;
/** Space for fixed reorder bar (bar + safe area estimate). */
const SERVICES_LIST_BOTTOM_PADDING_REORDER = 124;

function sectionCopy(view) {
  if (view === ENTITY_VIEW_ADDONS) {
    return {
      title: 'Add-ons',
      subtitle: 'Build optional upgrades customers can add to any service.',
      addLabel: 'Add add-on',
      emptyTitle: 'No add-ons yet',
      emptyBody:
        'Optional upgrades you create will show here. Tap Add add-on above to create your first one.',
    };
  }
  if (view === ENTITY_VIEW_CATEGORIES) {
    return {
      title: 'Categories',
      subtitle:
        'Optional groups for browsing. Each service still has its own name, price, and duration.',
      addLabel: 'Add category',
      emptyTitle: 'No categories yet',
      emptyBody:
        'Categories are optional. They let you group your services so customers can browse by group.',
    };
  }
  return {
    title: 'Services',
    subtitle: 'Manage the core services your team offers and control availability.',
    addLabel: 'Add service',
    emptyTitle: 'No services yet',
    emptyBody:
      'Services you add will show here and can be booked by customers. Tap Add service above to create your first one.',
  };
}

function ServicesCardsSkeleton() {
  return (
    <View style={styles.skeletonList}>
      {[0, 1, 2].map((k) => (
        <SurfaceCard key={k} style={styles.skeletonCard}>
          <SkeletonBox borderRadius={8} height={18} pulse width="48%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 10 }} width="36%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 12 }} width="88%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 8 }} width="72%" />
          <SkeletonBox borderRadius={12} height={42} pulse style={{ marginTop: 18 }} width="100%" />
        </SurfaceCard>
      ))}
    </View>
  );
}

export function ServicesScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { hasProAccess, isOwnerProfileLoaded } = useSubscription();
  const catalog = useServicesCatalog();
  const { refetch: refetchCatalog } = catalog;
  const categories = catalog.categories;
  const serviceCategoryById = catalog.serviceCategoryById;
  const categorySelectOptionsWithNone = catalog.categorySelectOptionsWithNone;
  const { mutateCategory, isSavingCategory } = useMutateServiceCategory({
    businessId: catalog.businessId,
    userId: user?.id,
  });
  const [selectedView, setSelectedView] = useState(ENTITY_VIEW_SERVICES);
  const [isSortMode, setIsSortMode] = useState(false);
  const [servicesDraft, setServicesDraft] = useState([]);
  const [categoriesDraft, setCategoriesDraft] = useState([]);
  const [addonSheetOpen, setAddonSheetOpen] = useState(false);
  const [editingAddonId, setEditingAddonId] = useState(null);
  const [addonSheetError, setAddonSheetError] = useState('');
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categorySheetError, setCategorySheetError] = useState('');
  const [serviceSheetOpen, setServiceSheetOpen] = useState(false);
  const [serviceSheetError, setServiceSheetError] = useState('');
  const [categoriesHowItWorksOpen, setCategoriesHowItWorksOpen] = useState(false);
  const [addonsHowItWorksOpen, setAddonsHowItWorksOpen] = useState(false);
  const [catalogManualRefreshing, setCatalogManualRefreshing] = useState(false);
  const isServicesView = selectedView === ENTITY_VIEW_SERVICES;
  const isCategoriesView = selectedView === ENTITY_VIEW_CATEGORIES;
  const isAddonsView = selectedView === ENTITY_VIEW_ADDONS;
  const categoriesWithCounts = useMemo(
    () => withCategoryServiceCounts(categories, servicesDraft, serviceCategoryById),
    [categories, serviceCategoryById, servicesDraft],
  );

  const activeItems = isServicesView
    ? servicesDraft
    : isCategoriesView
      ? categoriesWithCounts
      : catalog.addons;
  const activeCopy = sectionCopy(selectedView);

  const catalogUsesCategoryTabs = useMemo(
    () =>
      shouldShowCategoryTabs({
        categories,
        services: servicesDraft,
        serviceCategoryById,
      }),
    [categories, serviceCategoryById, servicesDraft],
  );

  const categoryTabsEnabled = isServicesView && catalogUsesCategoryTabs;
  const showCategoryTabsUi = categoryTabsEnabled && !isSortMode;
  const showServicesFab = showCategoryTabsUi;
  const showCategoriesFab = isCategoriesView && !isSortMode;
  const showAddonsFab = isAddonsView && !isSortMode;
  const showCatalogFab = showServicesFab || showCategoriesFab || showAddonsFab;
  const isReorderFocus = isSortMode && (isServicesView || isCategoriesView);
  const showAddInHeader = !isSortMode && isServicesView && !catalogUsesCategoryTabs;

  /** While sorting, `servicesDraft` is the source of truth — do not overwrite from query refetches (new array refs cause a visible flash on drop). */
  useEffect(() => {
    if (isServicesView && isSortMode) return;
    setServicesDraft(catalog.services);
  }, [catalog.services, isServicesView, isSortMode]);

  useEffect(() => {
    if (isCategoriesView && isSortMode) return;
    setCategoriesDraft(categoriesWithCounts);
  }, [categoriesWithCounts, isCategoriesView, isSortMode]);

  const displayItems = activeItems;

  const {
    tabs: serviceCategoryTabs,
    selectedTabId: selectedServiceCategoryTabId,
    setSelectedTabId: setSelectedServiceCategoryTabId,
    visibleServices: visibleServiceItems,
    activeTab,
    activeTabTitleLabel,
  } = useServiceCategoryTabs({
    enabled: categoryTabsEnabled,
    services: displayItems,
    categories,
    serviceCategoryById,
  });

  const activeTabServiceIds = useMemo(
    () => (activeTab?.services ?? []).map((service) => service.id),
    [activeTab?.services],
  );

  const sortableListData = useMemo(() => {
    if (!isServicesView || !isSortMode) return [];
    if (!catalogUsesCategoryTabs) return servicesDraft;
    return getServicesForCategoryTab(
      servicesDraft,
      selectedServiceCategoryTabId,
      serviceCategoryById,
    );
  }, [
    catalogUsesCategoryTabs,
    isServicesView,
    isSortMode,
    selectedServiceCategoryTabId,
    serviceCategoryById,
    servicesDraft,
  ]);

  const canReorderServices = useMemo(() => {
    if (!isServicesView) return false;
    const list = isSortMode ? sortableListData : visibleServiceItems;
    return (list?.length ?? 0) > 1;
  }, [isServicesView, isSortMode, sortableListData, visibleServiceItems]);

  const canReorderCategories = useMemo(() => {
    if (!isCategoriesView) return false;
    const list = isSortMode ? categoriesDraft : categoriesWithCounts;
    return (list?.length ?? 0) > 1;
  }, [categoriesDraft, categoriesWithCounts, isCategoriesView, isSortMode]);

  const sortableCategoriesData = useMemo(() => {
    if (!isCategoriesView || !isSortMode) return [];
    return categoriesDraft;
  }, [categoriesDraft, isCategoriesView, isSortMode]);

  useEffect(() => {
    if (!isSortMode || !catalogUsesCategoryTabs) return;
    setServicesDraft(catalog.services);
  }, [catalog.services, catalogUsesCategoryTabs, isSortMode, selectedServiceCategoryTabId]);

  const titleLabel = useMemo(() => {
    if (showCategoryTabsUi && activeTabTitleLabel) return activeTabTitleLabel;
    const count = activeItems.length;
    if (isServicesView) return `${count} services`;
    if (isCategoriesView) return `${count} ${count === 1 ? 'category' : 'categories'}`;
    return `${count} add-ons`;
  }, [
    activeItems.length,
    activeTabTitleLabel,
    isCategoriesView,
    isServicesView,
    showCategoryTabsUi,
  ]);

  const listBottomPadding = isReorderFocus
    ? SERVICES_LIST_BOTTOM_PADDING_REORDER
    : showCatalogFab
      ? SERVICES_LIST_BOTTOM_PADDING_WITH_FAB
      : SERVICES_LIST_BOTTOM_PADDING;

  const atFreeTierServicesLimit = useMemo(
    () =>
      isOwnerProfileLoaded &&
      !hasProAccess &&
      (catalog.services?.length ?? 0) >= FREE_TIER_MAX_SERVICES,
    [catalog.services?.length, hasProAccess, isOwnerProfileLoaded],
  );

  const servicesLimitCopy = useMemo(() => freeTierServicesLimitCopy(FREE_TIER_MAX_SERVICES), []);

  const { mutateAddon, isSavingAddon } = useMutateServiceAddon({
    businessId: catalog.businessId,
    userId: user?.id,
    serviceId: null,
  });
  const { deleteAddon, isDeletingAddon } = useDeleteServiceAddon({
    businessId: catalog.businessId,
    userId: user?.id,
    serviceId: null,
  });
  const { deleteService, isDeletingService, deleteServiceVariables } = useDeleteBusinessService({
    businessId: catalog.businessId,
    userId: user?.id,
  });
  const { createService, isCreatingService } = useCreateBusinessService({
    businessId: catalog.businessId,
    userId: user?.id,
  });
  const { setServiceActive, isTogglingServiceActive, toggleServiceVariables } =
    useUpdateBusinessServiceActive({
      businessId: catalog.businessId,
      userId: user?.id,
    });
  const { saveServicesOrder, isSavingServicesOrder } = useSaveBusinessServicesOrder({
    businessId: catalog.businessId,
    userId: user?.id,
  });
  const { saveCategoriesOrder, isSavingCategoriesOrder } = useSaveServiceCategoriesOrder({
    businessId: catalog.businessId,
    userId: user?.id,
  });

  const handleCatalogPullRefresh = useCallback(async () => {
    setCatalogManualRefreshing(true);
    try {
      await refetchCatalog();
    } finally {
      setCatalogManualRefreshing(false);
    }
  }, [refetchCatalog]);

  const catalogRefreshControl = useMemo(
    () => (
      <RefreshControl
        colors={[colors.accent]}
        onRefresh={handleCatalogPullRefresh}
        refreshing={catalogManualRefreshing}
        tintColor={colors.accent}
      />
    ),
    [colors.accent, catalogManualRefreshing, handleCatalogPullRefresh],
  );

  const editingAddon = useMemo(() => {
    if (!isAddonsView || !editingAddonId) return null;
    return activeItems.find((a) => a.id === editingAddonId) ?? null;
  }, [activeItems, editingAddonId, isAddonsView]);

  const editingCategory = useMemo(() => {
    if (!isCategoriesView || !editingCategoryId) return null;
    return categories.find((c) => c.id === editingCategoryId) ?? null;
  }, [categories, editingCategoryId, isCategoriesView]);

  function handleViewChange(nextView) {
    setSelectedView(nextView);
    setIsSortMode(false);
    setAddonSheetOpen(false);
    setEditingAddonId(null);
    setAddonSheetError('');
    setCategorySheetOpen(false);
    setEditingCategoryId(null);
    setCategorySheetError('');
    setServiceSheetOpen(false);
    setServiceSheetError('');
  }

  function openAddServiceSheet() {
    if (atFreeTierServicesLimit) {
      showWebAccountFeatureAlert({
        title: servicesLimitCopy.alertTitle,
        message: servicesLimitCopy.alertMessage,
      });
      return;
    }
    setServiceSheetError('');
    setServiceSheetOpen(true);
  }

  function openAddAddonSheet() {
    setEditingAddonId(null);
    setAddonSheetError('');
    setAddonSheetOpen(true);
  }

  function openAddCategorySheet() {
    setEditingCategoryId(null);
    setCategorySheetError('');
    setCategorySheetOpen(true);
  }

  function openEditCategorySheet(categoryId) {
    setEditingCategoryId(categoryId);
    setCategorySheetError('');
    setCategorySheetOpen(true);
  }

  function openEditAddonSheet(addonId) {
    setEditingAddonId(addonId);
    setAddonSheetError('');
    setAddonSheetOpen(true);
  }

  async function handleCategorySheetSave({ name }) {
    if (!catalog.businessId) {
      setCategorySheetError('Missing business context.');
      return;
    }
    try {
      setCategorySheetError('');
      if (editingCategoryId) {
        await mutateCategory({ mode: 'update', categoryId: editingCategoryId, name });
      } else {
        await mutateCategory({
          mode: 'create',
          name,
          sortOrder: categories.length * 10,
        });
      }
      setCategorySheetOpen(false);
      setEditingCategoryId(null);
    } catch (err) {
      setCategorySheetError(safeUserFacingMessage(err, { fallback: 'Could not save category' }));
    }
  }

  function confirmDeleteCategory(item) {
    if (!catalog.businessId) {
      Alert.alert('Could not delete', 'Missing business context. Please try again.');
      return;
    }

    const assignedServiceCount =
      typeof item?.assignedServiceCount === 'number'
        ? item.assignedServiceCount
        : countServicesAssignedToCategory(servicesDraft, serviceCategoryById, item.id);

    const { title, message, confirmText } = buildDeleteCategoryAlertContent({
      categoryName: item.name,
      assignedServiceCount,
    });

    Alert.alert(title, message, [
      { style: 'cancel', text: 'Cancel' },
      {
        style: 'destructive',
        text: confirmText,
        onPress: () => {
          void handleDeleteCategory(item);
        },
      },
    ]);
  }

  async function handleDeleteCategory(item) {
    if (!catalog.businessId) {
      Alert.alert('Could not delete', 'Missing business context. Please try again.');
      return;
    }

    try {
      await mutateCategory({ mode: 'delete', categoryId: item.id });
      if (editingCategoryId === item.id) {
        setCategorySheetOpen(false);
        setEditingCategoryId(null);
        setCategorySheetError('');
      }
      if (selectedServiceCategoryTabId === item.id) {
        setSelectedServiceCategoryTabId(UNCATEGORIZED_SERVICES_GROUP_ID);
      }
    } catch (err) {
      Alert.alert(
        'Could not delete',
        safeUserFacingMessage(err, { fallback: 'Could not delete category. Please try again.' }),
      );
    }
  }

  async function handleAddonSheetSave({ name, price, durationHHmm }) {
    if (!catalog.businessId) {
      setAddonSheetError('Missing business context.');
      return;
    }
    try {
      setAddonSheetError('');
      const normalizedDuration = normalizeAddonDurationHHmm(durationHHmm);
      if (editingAddonId) {
        await mutateAddon({
          mode: 'update',
          addonId: editingAddonId,
          name,
          price,
          durationHHmm: normalizedDuration,
        });
      } else {
        await mutateAddon({
          mode: 'create',
          name,
          price,
          durationHHmm: normalizedDuration,
        });
      }
      setAddonSheetOpen(false);
      setEditingAddonId(null);
    } catch (err) {
      setAddonSheetError(safeUserFacingMessage(err, { fallback: 'Could not save add-on' }));
    }
  }

  function confirmDeleteAddon(item) {
    Alert.alert(
      'Remove add-on?',
      'This add-on will be deleted. It will be removed from any services that use it. This cannot be undone.',
      [
        { style: 'cancel', text: 'Cancel' },
        {
          style: 'destructive',
          text: 'Delete',
          onPress: () => {
            void handleDeleteAddon(item);
          },
        },
      ],
    );
  }

  async function handleDeleteAddon(item) {
    try {
      await deleteAddon({ addonId: item.id });
      if (editingAddonId === item.id) {
        setAddonSheetOpen(false);
        setEditingAddonId(null);
      }
    } catch (err) {
      Alert.alert(
        'Could not delete',
        safeUserFacingMessage(err, { fallback: 'Please try again.' }),
      );
    }
  }

  function confirmDeleteService(item) {
    Alert.alert('Remove service?', 'This service will be deleted. This cannot be undone.', [
      { style: 'cancel', text: 'Cancel' },
      {
        style: 'destructive',
        text: 'Delete',
        onPress: () => {
          void handleDeleteService(item);
        },
      },
    ]);
  }

  async function handleDeleteService(item) {
    if (!catalog.businessId) return;
    try {
      await deleteService({ serviceId: item.id });
    } catch (err) {
      Alert.alert(
        'Could not delete',
        safeUserFacingMessage(err, { fallback: 'Please try again.' }),
      );
    }
  }

  async function handleToggleServiceActive(item, nextActive) {
    if (!catalog.businessId) return;
    try {
      await setServiceActive({ serviceId: item.id, isActive: nextActive });
    } catch (err) {
      Alert.alert(
        'Could not update',
        safeUserFacingMessage(err, { fallback: 'Please try again.' }),
      );
    }
  }

  async function handleServiceSheetSave({ name, description, price, durationHHmm, categoryId }) {
    if (!catalog.businessId) {
      setServiceSheetError('Missing business context.');
      return;
    }
    if (atFreeTierServicesLimit) {
      setServiceSheetError(servicesLimitCopy.sheetError);
      return;
    }
    try {
      setServiceSheetError('');
      const created = await createService({
        name,
        description,
        price,
        durationHHmm,
        categoryId,
      });
      if (!created?.id) {
        setServiceSheetError('Could not create service.');
        return;
      }
      setServiceSheetOpen(false);
    } catch (err) {
      setServiceSheetError(safeUserFacingMessage(err, { fallback: 'Could not create service.' }));
    }
  }

  const hasServiceOrderChanges = useMemo(() => {
    if (!isServicesView) return false;
    if (catalogUsesCategoryTabs && activeTabServiceIds.length > 0) {
      return hasOrderChangesWithinTab(catalog.services ?? [], servicesDraft, activeTabServiceIds);
    }
    const base = (catalog.services ?? []).map((s) => s.id);
    const draft = (servicesDraft ?? []).map((s) => s.id);
    if (base.length !== draft.length) return false;
    for (let i = 0; i < base.length; i += 1) {
      if (base[i] !== draft[i]) return true;
    }
    return false;
  }, [
    activeTabServiceIds,
    catalog.services,
    catalogUsesCategoryTabs,
    isServicesView,
    servicesDraft,
  ]);

  const hasCategoryOrderChangesFlag = useMemo(
    () => hasCategoryOrderChanges(catalog.categories, categoriesDraft),
    [catalog.categories, categoriesDraft],
  );

  const hasOrderChanges = isCategoriesView ? hasCategoryOrderChangesFlag : hasServiceOrderChanges;
  const isSavingOrder = isCategoriesView ? isSavingCategoriesOrder : isSavingServicesOrder;

  function handleStartReorder() {
    setIsSortMode(true);
  }

  function handleCancelReorder() {
    if (isServicesView) {
      setServicesDraft(catalog.services);
    }
    if (isCategoriesView) {
      setCategoriesDraft(categoriesWithCounts);
    }
    setIsSortMode(false);
  }

  async function handleSaveReorder() {
    if (!catalog.businessId) {
      Alert.alert('Could not save order', 'Missing business context.');
      return;
    }
    if (!hasOrderChanges) {
      setIsSortMode(false);
      return;
    }

    if (isCategoriesView) {
      try {
        await saveCategoriesOrder({
          orderedCategoryIds: categoriesDraft.map((category) => category.id),
        });
        setIsSortMode(false);
      } catch (err) {
        Alert.alert(
          'Could not save order',
          safeUserFacingMessage(err, {
            fallback: 'Could not save category order. Please try again.',
          }),
        );
      }
      return;
    }

    const orderedServiceIds = catalogUsesCategoryTabs
      ? getServicesForCategoryTab(
          servicesDraft,
          selectedServiceCategoryTabId,
          serviceCategoryById,
        ).map((s) => s.id)
      : servicesDraft.map((s) => s.id);
    try {
      await saveServicesOrder({ orderedServiceIds });
      setIsSortMode(false);
    } catch (err) {
      Alert.alert(
        'Could not save order',
        safeUserFacingMessage(err, { fallback: 'Please try again.' }),
      );
    }
  }

  function renderHeader() {
    return (
      <View style={[styles.listHeader, isReorderFocus && styles.listHeaderReorder]}>
        {isReorderFocus ? null : (
          <SegmentedEntityToggle onSelect={handleViewChange} selected={selectedView} />
        )}

        {isReorderFocus && isServicesView ? (
          <ServiceReorderHeaderBlock
            categoryName={activeTab?.name}
            hint={
              activeTab?.name
                ? `Drag to set the order customers see in ${activeTab.name}.`
                : 'Drag to set the order on your booking link.'
            }
          />
        ) : null}

        {isReorderFocus && isCategoriesView ? (
          <ServiceReorderHeaderBlock
            hint="Drag to set the order customers see on your booking link."
            title="Reorder categories"
          />
        ) : null}

        {isCategoriesView && !isSortMode ? (
          <ServiceCatalogMetaRow
            countLabel={titleLabel}
            disabled={catalog.isLoading}
            reorderAccessibilityLabel="Reorder categories"
            showReorder={canReorderCategories}
            onReorder={handleStartReorder}
          />
        ) : null}

        {isCategoriesView && !isSortMode ? (
          <CatalogHowItWorksLink
            accessibilityHint="Opens an explanation of service categories"
            label={SERVICE_CATEGORIES_HOW_IT_WORKS_TAB_LINK_LABEL}
            onPress={() => setCategoriesHowItWorksOpen(true)}
          />
        ) : null}

        {isAddonsView && !isSortMode ? (
          <>
            <ServiceCatalogMetaRow countLabel={titleLabel} />
            <CatalogHowItWorksLink
              accessibilityHint="Opens an explanation of service add-ons"
              label={SERVICE_ADDONS_HOW_IT_WORKS_LINK_LABEL}
              onPress={() => setAddonsHowItWorksOpen(true)}
            />
          </>
        ) : null}

        {showCategoryTabsUi && serviceCategoryTabs ? (
          <ServiceCategoryTabs
            onSelectTab={setSelectedServiceCategoryTabId}
            selectedTabId={selectedServiceCategoryTabId}
            tabs={serviceCategoryTabs}
          />
        ) : null}

        {isServicesView && !isSortMode ? (
          <ServiceCatalogMetaRow
            countLabel={titleLabel}
            disabled={catalog.isLoading}
            showReorder={canReorderServices}
            onReorder={handleStartReorder}
          />
        ) : null}

        {showAddInHeader ? (
          <View style={styles.actionsRow}>
            <View style={styles.actionCell}>
              <Button
                disabled={catalog.isLoading}
                fullWidth
                iconColor="#000000"
                iconName="add"
                title={activeCopy.addLabel}
                variant="surfaceLight"
                onPress={openAddServiceSheet}
              />
            </View>
          </View>
        ) : null}
        {isServicesView && atFreeTierServicesLimit && !catalog.isLoading && !isSortMode ? (
          <View
            style={[
              styles.freeTierServicesHint,
              {
                backgroundColor: colors.shellElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons color={colors.textMuted} name="information-circle-outline" size={18} />
            <AppText style={[styles.freeTierServicesHintText, { color: colors.textMuted }]}>
              {servicesLimitCopy.inlineHint}{' '}
              <Pressable
                accessibilityRole="link"
                hitSlop={6}
                onPress={() => {
                  void Linking.openURL(getWebAccountAdminUrl());
                }}
              >
                <AppText style={[styles.freeTierServicesHintLink, { color: colors.textSecondary }]}>
                  {servicesLimitCopy.inlineHintAction}
                </AppText>
              </Pressable>
            </AppText>
          </View>
        ) : null}
        {catalog.businessError ? (
          <View style={styles.errorBlock}>
            <SurfaceCard>
              <InlineCardError message={catalog.businessError} />
            </SurfaceCard>
          </View>
        ) : null}
        {catalog.catalogError ? (
          <View style={styles.errorBlock}>
            <SurfaceCard>
              <InlineCardError message={catalog.catalogError} />
            </SurfaceCard>
          </View>
        ) : null}
        {catalog.categoriesError && !catalog.catalogError ? (
          <View style={styles.errorBlock}>
            <SurfaceCard>
              <InlineCardError
                message={`${catalog.categoriesError} Services are shown in one list.`}
              />
            </SurfaceCard>
          </View>
        ) : null}
      </View>
    );
  }

  const renderCard = (item, index, onDragStart, isDragActive = false) => {
    if (isCategoriesView) {
      return (
        <CatalogEntityCard
          key={item.id}
          deleteDisabled={false}
          index={index}
          isDragActive={isDragActive}
          isSortMode={isSortMode}
          metaLines={[item.servicesCountLabel].filter(Boolean)}
          name={item.name}
          onDelete={() => {
            confirmDeleteCategory(item);
          }}
          onDragStart={onDragStart}
          onEdit={() => {
            openEditCategorySheet(item.id);
          }}
        />
      );
    }

    if (isAddonsView) {
      return (
        <CatalogEntityCard
          key={item.id}
          deleteDisabled={isDeletingAddon}
          metaLines={[normalizeAddonDurationLabelForCard(item.durationLabel)].filter(Boolean)}
          name={item.name}
          priceLabel={item.priceLabel}
          onDelete={() => {
            confirmDeleteAddon(item);
          }}
          onEdit={() => {
            openEditAddonSheet(item.id);
          }}
        />
      );
    }

    return (
      <ServiceEntityCard
        index={index}
        isDragActive={isDragActive}
        isSortMode={isSortMode}
        item={item}
        key={item.id}
        onDelete={() => {
          confirmDeleteService(item);
        }}
        onDragStart={onDragStart}
        onEdit={() => {
          navigation.navigate(ROUTES.SERVICES_EDIT, {
            service: item,
            serviceId: item.id,
          });
        }}
        onToggleEnabled={(next) => {
          void handleToggleServiceActive(item, next);
        }}
        showDescription={false}
        showHeaderDivider={false}
        showPrice
        showPriceCaption
        showToggle
        metaUnderTitle
        fullWidthActions={false}
        deleteDisabled={isDeletingService && deleteServiceVariables?.serviceId === item.id}
        toggleDisabled={isTogglingServiceActive && toggleServiceVariables?.serviceId === item.id}
      />
    );
  };

  function renderServiceListItems(items) {
    if (items.length === 0 && showCategoryTabsUi) {
      const isUncategorizedTab = isUncategorizedTabId(selectedServiceCategoryTabId);
      return (
        <View style={styles.emptyWrap}>
          <AppText style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            {isUncategorizedTab ? 'No services without a category' : 'No services in this category'}
          </AppText>
          <AppText style={[styles.emptyBody, { color: colors.textMuted }]}>
            {isUncategorizedTab
              ? 'Services you have not assigned to a category show here. Edit a service to add one, or tap + to create a new service.'
              : 'Assign services to this category from the edit screen, or tap + to add a new one.'}
          </AppText>
        </View>
      );
    }
    return items.map((item, index) => renderCard(item, index));
  }

  const sortableReorderData = isCategoriesView ? sortableCategoriesData : sortableListData;

  function handleReorderDragEnd(data) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (isCategoriesView) {
          setCategoriesDraft(data);
          return;
        }
        if (catalogUsesCategoryTabs) {
          setServicesDraft((prev) =>
            mergeServicesOrderWithinTab(
              prev,
              data.map((service) => service.id),
              data,
            ),
          );
          return;
        }
        setServicesDraft(data);
      });
    });
  }

  function renderReorderEmptyState() {
    if (isCategoriesView) {
      return (
        <View style={styles.emptyWrap}>
          <AppText style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            No categories to reorder
          </AppText>
          <AppText style={[styles.emptyBody, { color: colors.textMuted }]}>
            Add at least two categories to change their order.
          </AppText>
        </View>
      );
    }

    return (
      <View style={styles.emptyWrap}>
        <AppText style={[styles.emptyTitle, { color: colors.textSecondary }]}>
          No services to reorder
        </AppText>
        <AppText style={[styles.emptyBody, { color: colors.textMuted }]}>
          Add at least two services in this group to change their order.
        </AppText>
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.root, { backgroundColor: colors.shell }]}
    >
      {isReorderFocus && !catalog.isLoading ? (
        sortableReorderData.length > 0 ? (
          <DraggableFlatList
            activationDistance={10}
            contentContainerStyle={[styles.content, { paddingBottom: listBottomPadding }]}
            data={sortableReorderData}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={renderHeader}
            onDragEnd={({ data }) => {
              handleReorderDragEnd(data);
            }}
            renderItem={({ item, getIndex, drag, isActive }) => (
              <ScaleDecorator activeScale={1.02}>
                {renderCard(item, getIndex?.() ?? 0, drag, isActive)}
              </ScaleDecorator>
            )}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: listBottomPadding }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {renderHeader()}
            {renderReorderEmptyState()}
          </ScrollView>
        )
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: listBottomPadding }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={catalogRefreshControl}
          showsVerticalScrollIndicator={false}
        >
          {renderHeader()}
          {catalog.isLoading && !isCategoriesView ? (
            <ServicesCardsSkeleton />
          ) : displayItems.length === 0 ? (
            <View style={styles.emptyWrap}>
              <AppText style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                {activeCopy.emptyTitle}
              </AppText>
              <AppText style={[styles.emptyBody, { color: colors.textMuted }]}>
                {showServicesFab
                  ? 'Services you add will show here grouped by category. Use the + button to create your first one.'
                  : showCategoriesFab
                    ? 'Use the + button to create your first category and group services on your booking link.'
                    : showAddonsFab
                      ? 'Use the + button to create your first add-on.'
                      : activeCopy.emptyBody}
              </AppText>
            </View>
          ) : (
            renderServiceListItems(visibleServiceItems)
          )}
        </ScrollView>
      )}
      {showServicesFab ? (
        <AddServiceFab bottom={SERVICES_FAB_BOTTOM} onPress={openAddServiceSheet} />
      ) : null}
      {showCategoriesFab ? (
        <AddCategoryFab bottom={SERVICES_FAB_BOTTOM} onPress={openAddCategorySheet} />
      ) : null}
      {showAddonsFab ? (
        <AddAddonFab bottom={SERVICES_FAB_BOTTOM} onPress={openAddAddonSheet} />
      ) : null}
      {isReorderFocus ? (
        <ServiceReorderBottomBar
          isSaving={isSavingOrder}
          onCancel={handleCancelReorder}
          onSave={() => {
            void handleSaveReorder();
          }}
        />
      ) : null}
      <CategoryEditorSheet
        allowBackdropClose={false}
        initialName={editingCategory?.name ?? ''}
        isSaving={isSavingCategory}
        primaryButtonTitle={editingCategoryId ? 'Save' : 'Save category'}
        submitError={categorySheetError}
        title={editingCategoryId ? 'Edit category' : 'Add new category'}
        visible={isCategoriesView && categorySheetOpen && !isSortMode}
        onRequestClose={() => {
          setCategorySheetOpen(false);
          setEditingCategoryId(null);
          setCategorySheetError('');
        }}
        onSave={handleCategorySheetSave}
      />
      <AddonEditorSheet
        allowBackdropClose={false}
        initialDurationHHmm={editingAddon?.durationHHmm ?? ''}
        initialName={editingAddon?.name ?? ''}
        initialPrice={editingAddon?.price ?? ''}
        isSaving={isSavingAddon}
        primaryButtonTitle={editingAddonId ? 'Save' : 'Save add-on'}
        submitError={addonSheetError}
        title={editingAddonId ? 'Edit add-on' : 'Add new add-on'}
        visible={isAddonsView && addonSheetOpen}
        onRequestClose={() => {
          setAddonSheetOpen(false);
          setEditingAddonId(null);
          setAddonSheetError('');
        }}
        onSave={handleAddonSheetSave}
      />
      <ServiceCreateSheet
        allowBackdropClose={false}
        categorySelectOptionsWithNone={categories.length > 0 ? categorySelectOptionsWithNone : null}
        isSaving={isCreatingService}
        submitError={serviceSheetError}
        visible={isServicesView && serviceSheetOpen}
        onRequestClose={() => {
          setServiceSheetOpen(false);
          setServiceSheetError('');
        }}
        onSave={handleServiceSheetSave}
      />
      <ServiceCategoriesHowItWorksSheet
        visible={categoriesHowItWorksOpen}
        onRequestClose={() => setCategoriesHowItWorksOpen(false)}
      />
      <ServiceAddonsHowItWorksSheet
        visible={addonsHowItWorksOpen}
        onRequestClose={() => setAddonsHowItWorksOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  content: {
    paddingBottom: SERVICES_LIST_BOTTOM_PADDING,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  listHeader: {
    alignSelf: 'stretch',
    width: '100%',
  },
  listHeaderReorder: {
    paddingTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  actionCell: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  freeTierServicesHint: {
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    marginTop: -2,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  freeTierServicesHintText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
    lineHeight: 19,
    minWidth: 0,
  },
  freeTierServicesHintLink: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 19,
    textDecorationLine: 'underline',
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 28,
    paddingHorizontal: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
  errorBlock: {
    marginBottom: 12,
  },
  skeletonList: {
    gap: 12,
  },
  skeletonCard: {
    marginBottom: 0,
  },
});
