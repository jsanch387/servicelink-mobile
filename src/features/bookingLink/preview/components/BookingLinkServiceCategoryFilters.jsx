import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppText } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { useTheme } from '../../../../theme';

const FILTER_TAB_RADIUS = 10;

/**
 * Customer-facing category filters on the booking-link Services tab.
 * Rounded rectangles — labels only, no counts.
 */
export function BookingLinkServiceCategoryFilters({ tabs, selectedTabId, onSelectTab }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: {
          flexGrow: 0,
          marginBottom: 14,
        },
        content: {
          gap: 8,
          paddingHorizontal: SCREEN_GUTTER,
        },
        tab: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: FILTER_TAB_RADIUS,
          borderWidth: 1,
          minHeight: 36,
          paddingHorizontal: 14,
          paddingVertical: 8,
        },
        tabActive: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
        tabLabel: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: -0.15,
        },
        tabLabelActive: {
          color: colors.shell,
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
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
