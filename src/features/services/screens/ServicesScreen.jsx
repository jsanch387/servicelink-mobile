import { useEffect, useMemo, useState } from 'react';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, InlineCardError, SkeletonBox, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import {
  ENTITY_VIEW_ADDONS,
  ENTITY_VIEW_SERVICES,
  SegmentedEntityToggle,
} from '../components/SegmentedEntityToggle';
import { ServiceEntityCard } from '../components/ServiceEntityCard';
import { useServicesCatalog } from '../hooks/useServicesCatalog';
import { normalizeAddonDurationLabelForCard } from '../utils/buildServicesCatalogModel';

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
  const { colors } = useTheme();
  const catalog = useServicesCatalog();
  const [selectedView, setSelectedView] = useState(ENTITY_VIEW_SERVICES);
  const [isSortMode, setIsSortMode] = useState(false);
  const [servicesDraft, setServicesDraft] = useState([]);
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

  const displayItems = useMemo(() => {
    if (!isServicesView || !isSortMode) {
      return activeItems;
    }
    return activeItems;
  }, [activeItems, isServicesView, isSortMode]);

  function handleViewChange(nextView) {
    setSelectedView(nextView);
    setIsSortMode(false);
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
              onPress={() => {}}
            />
          </View>
          {isServicesView ? (
            <View style={styles.actionCell}>
              <Button
                disabled={catalog.isLoading || displayItems.length <= 1}
                fullWidth
                iconColor={colors.textMuted}
                iconName="swap-vertical-outline"
                outlineColor={colors.borderStrong}
                title={isSortMode ? 'Save order' : 'Sort order'}
                variant="outline"
                onPress={() => setIsSortMode((value) => !value)}
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
      onDelete={() => {}}
      onDragStart={onDragStart}
      onEdit={() => {}}
      onToggleEnabled={() => {}}
      showDescription={isServicesView && !isSortMode}
      showHeaderDivider={isServicesView}
      showPriceCaption={isServicesView}
      showToggle={isServicesView}
      metaUnderTitle={!isServicesView}
      fullWidthActions={!isServicesView}
      metaLabelOverride={
        !isServicesView ? normalizeAddonDurationLabelForCard(item.durationLabel) : undefined
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
