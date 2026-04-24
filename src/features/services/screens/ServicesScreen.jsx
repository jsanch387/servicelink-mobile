import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { MOCK_ADDONS, MOCK_SERVICES } from '../constants/mockServicesUiModel';
import {
  ENTITY_VIEW_ADDONS,
  ENTITY_VIEW_SERVICES,
  SegmentedEntityToggle,
} from '../components/SegmentedEntityToggle';
import { ServiceEntityCard } from '../components/ServiceEntityCard';

function moveItem(list, fromIndex, toIndex) {
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

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

export function ServicesScreen() {
  const { colors } = useTheme();
  const [selectedView, setSelectedView] = useState(ENTITY_VIEW_SERVICES);
  const [isSortMode, setIsSortMode] = useState(false);
  const [services, setServices] = useState(MOCK_SERVICES);
  const [addons, setAddons] = useState(MOCK_ADDONS);
  const isServicesView = selectedView === ENTITY_VIEW_SERVICES;

  const activeItems = isServicesView ? services : addons;
  const activeCopy = sectionCopy(selectedView);

  const titleLabel = useMemo(
    () => `${activeItems.length} ${selectedView === ENTITY_VIEW_SERVICES ? 'services' : 'add-ons'}`,
    [activeItems.length, selectedView],
  );

  function setCurrentList(updater) {
    if (selectedView === ENTITY_VIEW_SERVICES) {
      setServices(updater);
      return;
    }
    setAddons(updater);
  }

  function toggleEnabled(id) {
    setCurrentList((list) =>
      list.map((item) => (item.id === id ? { ...item, isEnabled: !item.isEnabled } : item)),
    );
  }

  function handleMove(index, direction) {
    const target = index + direction;
    setCurrentList((list) => {
      if (target < 0 || target >= list.length) return list;
      return moveItem(list, index, target);
    });
  }

  function handleViewChange(nextView) {
    setSelectedView(nextView);
    setIsSortMode(false);
  }

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.root, { backgroundColor: colors.shell }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SegmentedEntityToggle onSelect={handleViewChange} selected={selectedView} />

        <View style={styles.sectionMetaRow}>
          <View>
            <AppText style={[styles.sectionTitle, { color: colors.text }]}>{titleLabel}</AppText>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <View style={styles.actionCell}>
            <Button
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

        {activeItems.length === 0 ? (
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
          activeItems.map((item, index) => (
            <ServiceEntityCard
              canMoveDown={index < activeItems.length - 1}
              canMoveUp={index > 0}
              index={index}
              isSortMode={isServicesView && isSortMode}
              item={item}
              key={item.id}
              onDelete={() => {}}
              onEdit={() => {}}
              onMoveDown={() => handleMove(index, 1)}
              onMoveUp={() => handleMove(index, -1)}
              onToggleEnabled={() => toggleEnabled(item.id)}
              showDescription={isServicesView}
              showHeaderDivider={isServicesView}
              showPriceCaption={isServicesView}
              showToggle={isServicesView}
              metaUnderTitle={!isServicesView}
              fullWidthActions={!isServicesView}
              metaLabelOverride={
                !isServicesView
                  ? item.durationLabel.replace(/(\+?\d+)\s*m\b/gi, '$1 min')
                  : undefined
              }
            />
          ))
        )}
      </ScrollView>
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
});
