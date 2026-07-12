import * as Clipboard from 'expo-clipboard';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLayoutEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, InfoSection, SurfaceCard } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { CreatePromoCodeSheet } from '../components/CreatePromoCodeSheet';
import { usePromoCodes } from '../context/MarketingCampaignsContext';
import {
  formatMarketingDateRangeShort,
  formatMarketingDiscountLabel,
  getMarketingCampaignDisplayStatus,
  marketingStatusLabel,
} from '../utils/marketingCampaignModel';

export function PromoCodeDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const tabBarHeight = useBottomTabBarHeight();
  const campaignId = String(route.params?.campaignId ?? '').trim();
  const { getPromoById, updatePromo, deletePromo } = usePromoCodes();
  const promo = getPromoById(campaignId);
  const [editVisible, setEditVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: promo?.code ?? 'Promo code',
    });
  }, [navigation, promo?.code]);

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
          gap: 8,
          paddingVertical: 8,
        },
        code: {
          color: colors.text,
          fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
          fontSize: 28,
          fontWeight: '800',
          letterSpacing: 3,
          textAlign: 'center',
        },
        discount: {
          color: colors.textSecondary,
          fontSize: 17,
          fontWeight: '700',
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

  if (!promo) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.root}>
        <View style={styles.notFound}>
          <AppText style={styles.notFoundText}>This promo code could not be found.</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const status = getMarketingCampaignDisplayStatus(promo);

  function handleCopy() {
    void Clipboard.setStringAsync(String(promo.code ?? '')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDelete() {
    Alert.alert('Delete promo code?', `Remove ${promo.code} permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deletePromo(promo.id).then(({ error }) => {
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
            <AppText selectable style={styles.code}>
              {promo.code}
            </AppText>
            <AppText style={styles.discount}>{formatMarketingDiscountLabel(promo)}</AppText>
          </View>
        </SurfaceCard>

        <InfoSection
          rows={[
            { icon: 'pulse-outline', value: marketingStatusLabel(status) },
            {
              icon: 'calendar-outline',
              value: formatMarketingDateRangeShort(promo.startDateYyyyMmDd, promo.endDateYyyyMmDd),
            },
            {
              icon: 'people-outline',
              value: `${promo.currentUseCount ?? 0} uses`,
            },
          ]}
          title="Details"
        />

        <View style={styles.actions}>
          <Button
            fullWidth
            iconName={copied ? 'checkmark-circle-outline' : 'copy-outline'}
            title={copied ? 'Copied' : 'Copy code'}
            variant="secondary"
            onPress={handleCopy}
          />
          <Button
            fullWidth
            iconName="create-outline"
            title="Edit"
            variant="primary"
            onPress={() => setEditVisible(true)}
          />
          <View style={styles.danger}>
            <Button fullWidth title="Delete code" variant="danger" onPress={handleDelete} />
          </View>
        </View>
      </ScrollView>

      <CreatePromoCodeSheet
        editCampaign={promo}
        visible={editVisible}
        onCreated={() => {}}
        onRequestClose={() => setEditVisible(false)}
        onUpdated={async (updated) => {
          const { error } = await updatePromo(updated.id, updated);
          if (error) {
            throw new Error(error.message ?? 'Could not update promo code.');
          }
          setEditVisible(false);
        }}
      />
    </SafeAreaView>
  );
}
