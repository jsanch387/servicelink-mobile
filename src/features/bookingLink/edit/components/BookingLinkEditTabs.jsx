import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { BOOKING_LINK_EDIT_TABS } from '../constants/bookingLinkEditTabs';

export function BookingLinkEditTabs({ activeTab, onChangeTab }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        tabsRow: {
          borderBottomColor: colors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          marginTop: 12,
        },
        tab: {
          marginRight: 20,
          paddingBottom: 12,
          paddingTop: 0,
        },
        activeTab: {
          borderBottomColor: colors.text,
          borderBottomWidth: 2,
          marginBottom: -StyleSheet.hairlineWidth,
        },
        tabLabel: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
        },
        activeTabLabel: {
          color: colors.text,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.tabsRow}>
      {BOOKING_LINK_EDIT_TABS.map((tab) => {
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
