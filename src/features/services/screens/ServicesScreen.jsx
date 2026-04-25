import { useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, InlineCardError, SkeletonBox, SurfaceCard } from '../../../components/ui';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import { AddonEditorSheet } from '../components/AddonEditorSheet';
import { ServiceCreateSheet } from '../components/ServiceCreateSheet';
import {
  ENTITY_VIEW_ADDONS,
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

function sectionCopy(view) {
  if (view === ENTITY_VIEW_ADDONS) {
    return {
      title: 'Add-ons',
      subtitle: 'Build optional upgrades customers can add to any service.',
      addLabel: 'Add add-on',
      emptyLabel: 'No add-ons yet.',
    };
  }
  return {
    title: 'Services',
    subtitle: 'Manage the core services your team offers and control availability.',
    addLabel: 'Add service',
    emptyLabel: 'No services yet.',
  };
}

function ServicesCardsSkeleton() {
  return (
    <View style={styles.skeletonList}>
      {[0, 1, 2].map((k) => (
        <SurfaceCard key={k} style={styles.skeletonCard}>
          <SkeletonBox borderRadius={8} height={18} width="48%" />
          <SkeletonBox borderRadius={8} height={14} style={{ marginTop: 10 }} width="36%" />
          <SkeletonBox borderRadius={8} height={14} style={{ marginTop: 12 }} width="88%" />
          <SkeletonBox borderRadius={8} height={14} style={{ marginTop: 8 }} width="72%" />
          <SkeletonBox borderRadius={12} height={42} style={{ marginTop: 18 }} width="100%" />
        </SurfaceCard>
      ))}
    </View>
  );
}

export function ServicesScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const catalog = useServicesCatalog();
  const [selectedView, setSelectedView] = useState(ENTITY_VIEW_SERVICES);
  const [isSortMode, setIsSortMode] = useState(false);
  const [servicesDraft, setServicesDraft] = useState([]);
  const [addonSheetOpen, setAddonSheetOpen] = useState(false);
  const [editingAddonId, setEditingAddonId] = useState(null);
  const [addonSheetError, setAddonSheetError] = useState('');
  const [serviceSheetOpen, setServiceSheetOpen] = useState(false);
  const [serviceSheetError, setServiceSheetError] = useState('');
  const isServicesView = selectedView === ENTITY_VIEW_SERVICES;
  const activeItems = isServicesView ? servicesDraft : catalog.addons;
  const activeCopy = sectionCopy(selectedView);

  useEffect(() => {
    setServicesDraft(catalog.services);
  }, [catalog.services]);

  const titleLabel = useMemo(
    () => `${activeItems.length} ${selectedView === ENTITY_VIEW_SERVICES ? 'services' : 'add-ons'}`,
    [activeItems.length, selectedView],
  );

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

  const editingAddon = useMemo(() => {
    if (isServicesView || !editingAddonId) return null;
    return activeItems.find((a) => a.id === editingAddonId) ?? null;
  }, [activeItems, editingAddonId, isServicesView]);

  const displayItems = useMemo(() => {
    if (!isServicesView || !isSortMode) {
      return activeItems;
    }
    return activeItems;
  }, [activeItems, isServicesView, isSortMode]);

  function handleViewChange(nextView) {
    setSelectedView(nextView);
    setIsSortMode(false);
    setAddonSheetOpen(false);
    setEditingAddonId(null);
    setAddonSheetError('');
    setServiceSheetOpen(false);
    setServiceSheetError('');
  }

  function openAddServiceSheet() {
    setServiceSheetError('');
    setServiceSheetOpen(true);
  }

  function openAddAddonSheet() {
    setEditingAddonId(null);
    setAddonSheetError('');
    setAddonSheetOpen(true);
  }

  function openEditAddonSheet(addonId) {
    setEditingAddonId(addonId);
    setAddonSheetError('');
    setAddonSheetOpen(true);
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
      setAddonSheetError(err?.message ?? 'Could not save add-on');
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
      Alert.alert('Could not delete', err?.message ?? 'Please try again.');
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
      Alert.alert('Could not delete', err?.message ?? 'Please try again.');
    }
  }

  async function handleToggleServiceActive(item, nextActive) {
    if (!catalog.businessId) return;
    try {
      await setServiceActive({ serviceId: item.id, isActive: nextActive });
    } catch (err) {
      Alert.alert('Could not update', err?.message ?? 'Please try again.');
    }
  }

  async function handleServiceSheetSave({ name, description, price, durationHHmm }) {
    if (!catalog.businessId) {
      setServiceSheetError('Missing business context.');
      return;
    }
    try {
      setServiceSheetError('');
      await createService({ name, description, price, durationHHmm });
      setServiceSheetOpen(false);
    } catch (err) {
      setServiceSheetError(err?.message ?? 'Could not create service.');
    }
  }

  const hasOrderChanges = useMemo(() => {
    if (!isServicesView) return false;
    const base = (catalog.services ?? []).map((s) => s.id);
    const draft = (servicesDraft ?? []).map((s) => s.id);
    if (base.length !== draft.length) return false;
    for (let i = 0; i < base.length; i += 1) {
      if (base[i] !== draft[i]) return true;
    }
    return false;
  }, [catalog.services, isServicesView, servicesDraft]);

  async function handleSortModeAction() {
    if (!isSortMode) {
      setIsSortMode(true);
      return;
    }
    if (!catalog.businessId) {
      Alert.alert('Could not save order', 'Missing business context.');
      return;
    }
    if (!hasOrderChanges) {
      setIsSortMode(false);
      return;
    }
    try {
      await saveServicesOrder({
        orderedServiceIds: servicesDraft.map((s) => s.id),
      });
      setIsSortMode(false);
    } catch (err) {
      Alert.alert('Could not save order', err?.message ?? 'Please try again.');
    }
  }

  function renderHeader() {
    return (
      <>
        <SegmentedEntityToggle onSelect={handleViewChange} selected={selectedView} />

        <View style={styles.sectionMetaRow}>
          <View>
            <AppText style={[styles.sectionTitle, { color: colors.text }]}>{titleLabel}</AppText>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <View style={styles.actionCell}>
            <Button
              disabled={catalog.isLoading}
              fullWidth
              iconColor="#000000"
              iconName="add"
              title={activeCopy.addLabel}
              variant="surfaceLight"
              onPress={() => {
                if (isServicesView) {
                  openAddServiceSheet();
                  return;
                }
                openAddAddonSheet();
              }}
            />
          </View>
          {isServicesView ? (
            <View style={styles.actionCell}>
              <Button
                disabled={
                  catalog.isLoading ||
                  displayItems.length <= 1 ||
                  (isSortMode && isSavingServicesOrder)
                }
                fullWidth
                iconColor={isSortMode ? '#000000' : colors.textMuted}
                iconName={isSortMode ? 'checkmark' : 'swap-vertical-outline'}
                outlineColor={isSortMode ? undefined : colors.borderStrong}
                title={isSortMode ? 'Save order' : 'Sort order'}
                variant={isSortMode ? 'surfaceLight' : 'outline'}
                onPress={() => {
                  void handleSortModeAction();
                }}
              />
            </View>
          ) : null}
        </View>
        {isServicesView && isSortMode ? (
          <View style={[styles.sortModeBanner, { borderColor: colors.borderStrong }]}>
            <Ionicons color="#22c55e" name="move-outline" size={16} />
            <AppText style={[styles.sortHint, { color: colors.textMuted }]}>
              Long press and drag to reorder.
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
      </>
    );
  }

  const renderCard = (item, index, onDragStart, isDragActive = false) => (
    <ServiceEntityCard
      index={index}
      isDragActive={isDragActive}
      isSortMode={isServicesView && isSortMode}
      item={item}
      key={item.id}
      onDelete={() => {
        if (isServicesView) {
          confirmDeleteService(item);
          return;
        }
        confirmDeleteAddon(item);
      }}
      onDragStart={onDragStart}
      onEdit={() => {
        if (isServicesView) {
          navigation.navigate(ROUTES.SERVICES_EDIT, {
            service: item,
            serviceId: item.id,
          });
          return;
        }
        openEditAddonSheet(item.id);
      }}
      onToggleEnabled={(next) => {
        if (!isServicesView) return;
        void handleToggleServiceActive(item, next);
      }}
      showDescription={isServicesView && !isSortMode}
      showHeaderDivider={isServicesView}
      showPriceCaption={isServicesView}
      showToggle={isServicesView}
      metaUnderTitle={!isServicesView}
      fullWidthActions={!isServicesView}
      metaLabelOverride={
        !isServicesView
          ? normalizeAddonDurationLabelForCard(item.durationLabel) || undefined
          : undefined
      }
      deleteDisabled={
        (isServicesView && isDeletingService && deleteServiceVariables?.serviceId === item.id) ||
        (!isServicesView && isDeletingAddon)
      }
      toggleDisabled={
        isServicesView && isTogglingServiceActive && toggleServiceVariables?.serviceId === item.id
      }
    />
  );

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.root, { backgroundColor: colors.shell }]}
    >
      {isServicesView && isSortMode && !catalog.isLoading && displayItems.length > 0 ? (
        <DraggableFlatList
          activationDistance={10}
          contentContainerStyle={styles.content}
          data={displayItems}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={renderHeader}
          onDragEnd={({ data }) => setServicesDraft(data)}
          refreshControl={
            <RefreshControl
              colors={[colors.accent]}
              onRefresh={catalog.refetch}
              refreshing={catalog.isFetching && !catalog.isLoading}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item, getIndex, drag, isActive }) =>
            renderCard(item, getIndex?.() ?? 0, drag, isActive)
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              colors={[colors.accent]}
              onRefresh={catalog.refetch}
              refreshing={catalog.isFetching && !catalog.isLoading}
              tintColor={colors.accent}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {renderHeader()}
          {catalog.isLoading ? (
            <ServicesCardsSkeleton />
          ) : displayItems.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                { borderColor: colors.border, backgroundColor: colors.cardSurface },
              ]}
            >
              <AppText style={[styles.emptyText, { color: colors.textMuted }]}>
                {activeCopy.emptyLabel}
              </AppText>
            </View>
          ) : (
            displayItems.map((item, index) => renderCard(item, index))
          )}
        </ScrollView>
      )}
      <AddonEditorSheet
        allowBackdropClose={false}
        initialDurationHHmm={editingAddon?.durationHHmm ?? ''}
        initialName={editingAddon?.name ?? ''}
        initialPrice={editingAddon?.price ?? ''}
        isSaving={isSavingAddon}
        primaryButtonTitle={editingAddonId ? 'Save' : 'Save add-on'}
        submitError={addonSheetError}
        title={editingAddonId ? 'Edit add-on' : 'Add new add-on'}
        visible={!isServicesView && addonSheetOpen}
        onRequestClose={() => {
          setAddonSheetOpen(false);
          setEditingAddonId(null);
          setAddonSheetError('');
        }}
        onSave={handleAddonSheetSave}
      />
      <ServiceCreateSheet
        allowBackdropClose={false}
        isSaving={isCreatingService}
        submitError={serviceSheetError}
        visible={isServicesView && serviceSheetOpen}
        onRequestClose={() => {
          setServiceSheetOpen(false);
          setServiceSheetError('');
        }}
        onSave={handleServiceSheetSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingBottom: 36,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionMetaRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  sortHint: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  sortModeBanner: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 10,
    marginTop: -2,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionCell: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  emptyState: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
    minHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 28,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
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
