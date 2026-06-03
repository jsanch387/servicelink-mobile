import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { useTheme } from '../../../../theme';
import { BOOKING_LINK_PREVIEW_TABS } from '../../constants/bookingLinkPreviewTabs';

export function BookingLinkTabs({ activeTab, onChangeTab }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        tabsRow: {
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          flexDirection: 'row',
          marginTop: 26,
          paddingHorizontal: SCREEN_GUTTER,
        },
        tab: {
          marginRight: 24,
          paddingBottom: 14,
          paddingTop: 2,
        },
        activeTab: {
          borderBottomColor: colors.text,
          borderBottomWidth: 2,
        },
        tabLabel: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
        },
        activeTabLabel: {
          color: colors.textSecondary,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.tabsRow}>
      {BOOKING_LINK_PREVIEW_TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onChangeTab(tab.key)}
          >
            <AppText style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
