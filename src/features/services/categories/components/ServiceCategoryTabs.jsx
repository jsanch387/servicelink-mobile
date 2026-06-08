import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

export function ServiceCategoryTabs({ tabs, selectedTabId, onSelectTab }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: {
          flexGrow: 0,
          marginBottom: 12,
          marginHorizontal: -16,
        },
        content: {
          paddingHorizontal: 16,
        },
        tab: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 999,
          borderWidth: 1,
          flexDirection: 'row',
          marginRight: 8,
          minHeight: 34,
          paddingHorizontal: 12,
          paddingVertical: 6,
        },
        tabActive: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
        tabLabel: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
        tabLabelActive: {
          color: colors.shell,
        },
        tabCount: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
          marginLeft: 6,
          opacity: 0.85,
        },
        tabCountActive: {
          color: colors.shell,
          opacity: 0.9,
        },
      }),
    [colors],
  );

  if (!tabs?.length) return null;

  return (
    <ScrollView
      horizontal
      accessibilityRole="tablist"
      contentContainerStyle={styles.content}
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
    >
      {tabs.map((tab) => {
        const isSelected = tab.id === selectedTabId;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            key={tab.id}
            onPress={() => onSelectTab(tab.id)}
            style={[styles.tab, isSelected && styles.tabActive]}
          >
            <AppText style={[styles.tabLabel, isSelected && styles.tabLabelActive]}>
              {tab.name}
            </AppText>
            <AppText style={[styles.tabCount, isSelected && styles.tabCountActive]}>
              {tab.count}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
