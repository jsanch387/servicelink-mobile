import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppText,
  Button,
  InlineCardError,
  SegmentedToggle,
  SurfaceCard,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { showWebAccountFeatureAlert, useSubscription } from '../../subscription';
import { CreatePromoCodeSheet } from '../components/CreatePromoCodeSheet';
import { CreateSaleSheet } from '../components/CreateSaleSheet';
import { MarketingCampaignCard } from '../components/MarketingCampaignCard';
import { MarketingHowItWorks } from '../components/MarketingHowItWorks';
import { PromoCodeSuccessModal } from '../components/PromoCodeSuccessModal';
import { SaleSuccessModal } from '../components/SaleSuccessModal';
import {
  MARKETING_TAB_PROMOS,
  MARKETING_TAB_SALES,
  PROMO_CODES_EMPTY,
  SALES_EMPTY,
} from '../constants';
import { MARKETING_PRO_ACCESS } from '../constants/marketingAccessCopy';
import { usePromoCodes, useSales } from '../context/MarketingCampaignsContext';
import { marketingErrorMessage } from '../utils/marketingDbMap';

const CREATE_BUTTON_BOTTOM = 20;
const CREATE_BUTTON_HEIGHT = 52;
const LIST_GAP = 10;

const MARKETING_TOGGLE_OPTIONS = [
  { key: MARKETING_TAB_PROMOS, label: 'Codes', iconName: 'ticket-outline' },
  { key: MARKETING_TAB_SALES, label: 'Sales', iconName: 'megaphone-outline' },
];

export function MarketingScreen() {
  const { colors } = useTheme();
  const { hasProAccess, isOwnerProfileLoaded } = useSubscription();
  const {
    promos,
    addPromo,
    updatePromo,
    togglePromoEnabled,
    deletePromo,
    isLoading: promosLoading,
    errorMessage: promosError,
    refetch: refetchPromos,
  } = usePromoCodes();
  const {
    sales,
    addSale,
    updateSale,
    toggleSaleEnabled,
    deleteSale,
    isLoading: salesLoading,
    errorMessage: salesError,
    refetch: refetchSales,
  } = useSales();

  const canMutate = Boolean(isOwnerProfileLoaded && hasProAccess);
  const isLoading = promosLoading || salesLoading || !isOwnerProfileLoaded;
  const errorMessage = promosError || salesError;

  const [activeTab, setActiveTab] = useState(MARKETING_TAB_PROMOS);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [promoCreateVisible, setPromoCreateVisible] = useState(false);
  const [saleCreateVisible, setSaleCreateVisible] = useState(false);
  const [editPromo, setEditPromo] = useState(
    /** @type {import('../utils/marketingCampaignModel').MarketingCampaign | null} */ (null),
  );
  const [editSale, setEditSale] = useState(
    /** @type {import('../utils/marketingCampaignModel').MarketingCampaign | null} */ (null),
  );
  const [successPromo, setSuccessPromo] = useState(
    /** @type {import('../utils/marketingCampaignModel').MarketingCampaign | null} */ (null),
  );
  const [successSale, setSuccessSale] = useState(
    /** @type {import('../utils/marketingCampaignModel').MarketingCampaign | null} */ (null),
  );
  const pendingPromoSuccessRef = useRef(
    /** @type {import('../utils/marketingCampaignModel').MarketingCampaign | null} */ (null),
  );
  const pendingSaleSuccessRef = useRef(
    /** @type {import('../utils/marketingCampaignModel').MarketingCampaign | null} */ (null),
  );

  const isPromosTab = activeTab === MARKETING_TAB_PROMOS;
  const items = isPromosTab ? promos : sales;
  const emptyCopy = isPromosTab ? PROMO_CODES_EMPTY : SALES_EMPTY;

  const bottomBarReserve = CREATE_BUTTON_HEIGHT + CREATE_BUTTON_BOTTOM + 8;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
          position: 'relative',
        },
        main: {
          flex: 1,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        body: {
          flex: 1,
          paddingBottom: bottomBarReserve,
        },
        listContent: {
          gap: LIST_GAP,
          paddingBottom: bottomBarReserve,
          paddingTop: 4,
        },
        emptyWrap: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 20,
        },
        emptyIcon: {
          marginBottom: 12,
          opacity: 0.55,
        },
        emptyTitle: {
          color: colors.textSecondary,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.2,
          textAlign: 'center',
        },
        emptyBody: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 21,
          marginTop: 8,
          textAlign: 'center',
        },
        bottomBar: {
          bottom: CREATE_BUTTON_BOTTOM,
          left: SCREEN_GUTTER,
          position: 'absolute',
          right: SCREEN_GUTTER,
        },
        loadingWrap: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
        },
        errorBlock: {
          marginBottom: 12,
        },
      }),
    [bottomBarReserve, colors],
  );

  const requirePro = useCallback(() => {
    showWebAccountFeatureAlert({
      title: MARKETING_PRO_ACCESS.alertTitle,
      message: MARKETING_PRO_ACCESS.alertMessage,
    });
  }, []);

  const handleOpenCreate = useCallback(() => {
    if (!isOwnerProfileLoaded) return;
    if (!hasProAccess) {
      requirePro();
      return;
    }
    if (isPromosTab) setPromoCreateVisible(true);
    else setSaleCreateVisible(true);
  }, [hasProAccess, isOwnerProfileLoaded, isPromosTab, requirePro]);

  async function handlePromoCreated(promo) {
    const { data, error } = await addPromo(promo);
    if (error) {
      throw new Error(marketingErrorMessage(error, 'Could not create promo code.'));
    }
    pendingPromoSuccessRef.current = data ?? promo;
    setPromoCreateVisible(false);
  }

  async function handleSaleCreated(sale) {
    const { data, error } = await addSale(sale);
    if (error) {
      throw new Error(marketingErrorMessage(error, 'Could not create sale.'));
    }
    pendingSaleSuccessRef.current = data ?? sale;
    setSaleCreateVisible(false);
  }

  async function handlePromoUpdated(updated) {
    const { error } = await updatePromo(updated.id, updated);
    if (error) {
      throw new Error(marketingErrorMessage(error, 'Could not update promo code.'));
    }
    closePromoSheet();
  }

  async function handleSaleUpdated(updated) {
    const { error } = await updateSale(updated.id, updated);
    if (error) {
      throw new Error(marketingErrorMessage(error, 'Could not update sale.'));
    }
    closeSaleSheet();
  }

  function handleDeletePromo(promo) {
    if (!isOwnerProfileLoaded) return;
    if (!hasProAccess) {
      requirePro();
      return;
    }
    Alert.alert('Delete promo code?', `Remove ${promo.code} permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deletePromo(promo.id).then(({ error }) => {
            if (error) {
              Alert.alert('Could not delete', marketingErrorMessage(error));
            }
          });
        },
      },
    ]);
  }

  function handleDeleteSale(sale) {
    if (!isOwnerProfileLoaded) return;
    if (!hasProAccess) {
      requirePro();
      return;
    }
    Alert.alert('Delete sale?', `Remove ${sale.name} permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteSale(sale.id).then(({ error }) => {
            if (error) {
              Alert.alert('Could not delete', marketingErrorMessage(error));
            }
          });
        },
      },
    ]);
  }

  function handleTogglePromo(promo, isEnabled) {
    if (!isOwnerProfileLoaded) return;
    if (!hasProAccess) {
      requirePro();
      return;
    }
    void togglePromoEnabled(promo.id, isEnabled).then(({ error }) => {
      if (error) {
        Alert.alert('Could not update', marketingErrorMessage(error));
      }
    });
  }

  function handleToggleSale(sale, isEnabled) {
    if (!isOwnerProfileLoaded) return;
    if (!hasProAccess) {
      requirePro();
      return;
    }
    void toggleSaleEnabled(sale.id, isEnabled).then(({ error }) => {
      if (error) {
        Alert.alert('Could not update', marketingErrorMessage(error));
      }
    });
  }

  function closePromoSheet() {
    setPromoCreateVisible(false);
    setEditPromo(null);
  }

  function closeSaleSheet() {
    setSaleCreateVisible(false);
    setEditSale(null);
  }

  useEffect(() => {
    if (promoCreateVisible || !pendingPromoSuccessRef.current) return undefined;

    const promo = pendingPromoSuccessRef.current;
    const timer = setTimeout(() => {
      pendingPromoSuccessRef.current = null;
      setSuccessPromo(promo);
    }, 320);

    return () => clearTimeout(timer);
  }, [promoCreateVisible]);

  useEffect(() => {
    if (saleCreateVisible || !pendingSaleSuccessRef.current) return undefined;

    const sale = pendingSaleSuccessRef.current;
    const timer = setTimeout(() => {
      pendingSaleSuccessRef.current = null;
      setSuccessSale(sale);
    }, 320);

    return () => clearTimeout(timer);
  }, [saleCreateVisible]);

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.root}>
      <View style={styles.main}>
        <SegmentedToggle
          onSelect={setActiveTab}
          options={MARKETING_TOGGLE_OPTIONS}
          selected={activeTab}
        />

        <View style={styles.body}>
          {errorMessage ? (
            <View style={styles.errorBlock}>
              <SurfaceCard padding="md">
                <InlineCardError message={errorMessage} />
              </SurfaceCard>
            </View>
          ) : null}

          {isLoading && items.length === 0 ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons
                color={colors.textMuted}
                name={isPromosTab ? 'ticket-outline' : 'megaphone-outline'}
                size={28}
                style={styles.emptyIcon}
              />
              <AppText style={styles.emptyTitle}>{emptyCopy.title}</AppText>
              <AppText style={styles.emptyBody}>{emptyCopy.body}</AppText>
              <MarketingHowItWorks isPromosTab={isPromosTab} />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl
                  refreshing={listRefreshing}
                  tintColor={colors.accent}
                  onRefresh={() => {
                    setListRefreshing(true);
                    void Promise.all([refetchPromos(), refetchSales()]).finally(() => {
                      setListRefreshing(false);
                    });
                  }}
                />
              }
              showsVerticalScrollIndicator={false}
            >
              {isPromosTab
                ? promos.map((promo) => (
                    <MarketingCampaignCard
                      key={promo.id}
                      actionsDisabled={!canMutate}
                      campaign={promo}
                      onDelete={() => handleDeletePromo(promo)}
                      onEdit={() => {
                        if (!isOwnerProfileLoaded) return;
                        if (!hasProAccess) {
                          requirePro();
                          return;
                        }
                        setEditPromo(promo);
                      }}
                      onToggleEnabled={(isEnabled) => handleTogglePromo(promo, isEnabled)}
                    />
                  ))
                : sales.map((sale) => (
                    <MarketingCampaignCard
                      key={sale.id}
                      actionsDisabled={!canMutate}
                      campaign={sale}
                      onDelete={() => handleDeleteSale(sale)}
                      onEdit={() => {
                        if (!isOwnerProfileLoaded) return;
                        if (!hasProAccess) {
                          requirePro();
                          return;
                        }
                        setEditSale(sale);
                      }}
                      onToggleEnabled={(isEnabled) => handleToggleSale(sale, isEnabled)}
                    />
                  ))}
            </ScrollView>
          )}
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Button
          fullWidth
          iconName={isPromosTab ? 'ticket-outline' : 'megaphone-outline'}
          title={isPromosTab ? 'New promo code' : 'New sale'}
          variant="primary"
          onPress={handleOpenCreate}
        />
      </View>

      <CreatePromoCodeSheet
        editCampaign={editPromo}
        visible={promoCreateVisible || editPromo != null}
        onCreated={handlePromoCreated}
        onRequestClose={closePromoSheet}
        onUpdated={handlePromoUpdated}
      />

      <CreateSaleSheet
        editCampaign={editSale}
        visible={saleCreateVisible || editSale != null}
        onCreated={handleSaleCreated}
        onRequestClose={closeSaleSheet}
        onUpdated={handleSaleUpdated}
      />

      <PromoCodeSuccessModal
        promo={successPromo}
        visible={successPromo != null}
        onDone={() => setSuccessPromo(null)}
      />

      <SaleSuccessModal
        sale={successSale}
        visible={successSale != null}
        onDone={() => setSuccessSale(null)}
      />
    </SafeAreaView>
  );
}
