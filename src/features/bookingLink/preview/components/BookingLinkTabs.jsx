import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

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
          paddingHorizontal: 20,
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
      <Pressable
        style={[styles.tab, activeTab === 'services' && styles.activeTab]}
        onPress={() => onChangeTab('services')}
      >
        <AppText style={[styles.tabLabel, activeTab === 'services' && styles.activeTabLabel]}>
          Services
        </AppText>
      </Pressable>
      <Pressable
        style={[styles.tab, activeTab === 'gallery' && styles.activeTab]}
        onPress={() => onChangeTab('gallery')}
      >
        <AppText style={[styles.tabLabel, activeTab === 'gallery' && styles.activeTabLabel]}>
          Gallery
        </AppText>
      </Pressable>
      <Pressable
        style={[styles.tab, activeTab === 'bio' && styles.activeTab]}
        onPress={() => onChangeTab('bio')}
      >
        <AppText style={[styles.tabLabel, activeTab === 'bio' && styles.activeTabLabel]}>
          Bio
        </AppText>
      </Pressable>
    </View>
  );
}
