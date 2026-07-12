import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLayoutEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, InfoSection, SurfaceCard } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { CreateSaleSheet } from '../components/CreateSaleSheet';
import { useSales } from '../context/MarketingCampaignsContext';
import {
  formatMarketingDateRangeShort,
  formatMarketingDiscountLabel,
  getMarketingCampaignDisplayStatus,
  marketingStatusLabel,
} from '../utils/marketingCampaignModel';

export function SaleDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const tabBarHeight = useBottomTabBarHeight();
  const campaignId = String(route.params?.campaignId ?? '').trim();
  const { getSaleById, updateSale, deleteSale } = useSales();
  const sale = getSaleById(campaignId);
  const [editVisible, setEditVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: sale?.name ?? 'Sale',
    });
  }, [navigation, sale?.name]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        scroll: {
          flex: 1,
        },
        content: {
          gap: 16,
          paddingBottom: 28 + Math.max(tabBarHeight, 72),
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        hero: {
          alignItems: 'center',
          gap: 6,
          paddingVertical: 12,
        },
        discount: {
          color: colors.text,
          fontSize: 32,
          fontWeight: '800',
          letterSpacing: -0.4,
        },
        actions: {
          gap: 10,
        },
        danger: {
          marginTop: 8,
        },
        notFound: {
          alignItems: 'center',
          paddingTop: 48,
        },
        notFoundText: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
        },
      }),
    [colors, tabBarHeight],
  );

  if (!sale) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.root}>
        <View style={styles.notFound}>
          <AppText style={styles.notFoundText}>This sale could not be found.</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const status = getMarketingCampaignDisplayStatus(sale);

  function handleDelete() {
    Alert.alert('Delete sale?', `Remove "${sale.name}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteSale(sale.id).then(({ error }) => {
            if (error) {
              Alert.alert('Could not delete', error.message ?? 'Try again.');
              return;
            }
            navigation.goBack();
          });
        },
      },
    ]);
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <SurfaceCard padding="md">
          <View style={styles.hero}>
            <AppText style={styles.discount}>{formatMarketingDiscountLabel(sale)}</AppText>
          </View>
        </SurfaceCard>

        <InfoSection
          rows={[
            { icon: 'pricetag-outline', value: sale.name },
            { icon: 'pulse-outline', value: marketingStatusLabel(status) },
            {
              icon: 'calendar-outline',
              value: formatMarketingDateRangeShort(sale.startDateYyyyMmDd, sale.endDateYyyyMmDd),
            },
          ]}
          title="Details"
        />

        <View style={styles.actions}>
          <Button
            fullWidth
            iconName="create-outline"
            title="Edit sale"
            variant="primary"
            onPress={() => setEditVisible(true)}
          />
          <View style={styles.danger}>
            <Button fullWidth title="Delete sale" variant="danger" onPress={handleDelete} />
          </View>
        </View>
      </ScrollView>

      <CreateSaleSheet
        editCampaign={sale}
        visible={editVisible}
        onCreated={() => {}}
        onRequestClose={() => setEditVisible(false)}
        onUpdated={async (updated) => {
          const { error } = await updateSale(updated.id, updated);
          if (error) {
            throw new Error(error.message ?? 'Could not update sale.');
          }
          setEditVisible(false);
        }}
      />
    </SafeAreaView>
  );
}
