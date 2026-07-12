import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, SegmentedToggle } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
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
import { usePromoCodes, useSales } from '../context/MarketingCampaignsContext';

const CREATE_BUTTON_BOTTOM = 20;
const CREATE_BUTTON_HEIGHT = 52;
const LIST_GAP = 10;

const MARKETING_TOGGLE_OPTIONS = [
  { key: MARKETING_TAB_PROMOS, label: 'Codes', iconName: 'ticket-outline' },
  { key: MARKETING_TAB_SALES, label: 'Sales', iconName: 'megaphone-outline' },
];

export function MarketingScreen() {
  const { colors } = useTheme();
  const { promos, addPromo, updatePromo, deletePromo } = usePromoCodes();
  const { sales, addSale, updateSale, deleteSale } = useSales();

  const [activeTab, setActiveTab] = useState(MARKETING_TAB_PROMOS);
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
      }),
    [bottomBarReserve, colors],
  );

  function handlePromoCreated(promo) {
    addPromo(promo);
    pendingPromoSuccessRef.current = promo;
    setPromoCreateVisible(false);
  }

  function handleSaleCreated(sale) {
    addSale(sale);
    pendingSaleSuccessRef.current = sale;
    setSaleCreateVisible(false);
  }

  function handleDeletePromo(promo) {
    Alert.alert('Delete promo code?', `Remove ${promo.code} permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deletePromo(promo.id),
      },
    ]);
  }

  function handleDeleteSale(sale) {
    Alert.alert('Delete sale?', `Remove ${sale.name} permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteSale(sale.id),
      },
    ]);
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
          {items.length === 0 ? (
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
              showsVerticalScrollIndicator={false}
            >
              {isPromosTab
                ? promos.map((promo) => (
                    <MarketingCampaignCard
                      key={promo.id}
                      campaign={promo}
                      onDelete={() => handleDeletePromo(promo)}
                      onEdit={() => setEditPromo(promo)}
                      onToggleEnabled={(isEnabled) => updatePromo(promo.id, { isEnabled })}
                    />
                  ))
                : sales.map((sale) => (
                    <MarketingCampaignCard
                      key={sale.id}
                      campaign={sale}
                      onDelete={() => handleDeleteSale(sale)}
                      onEdit={() => setEditSale(sale)}
                      onToggleEnabled={(isEnabled) => updateSale(sale.id, { isEnabled })}
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
          onPress={() => {
            if (isPromosTab) setPromoCreateVisible(true);
            else setSaleCreateVisible(true);
          }}
        />
      </View>

      <CreatePromoCodeSheet
        editCampaign={editPromo}
        visible={promoCreateVisible || editPromo != null}
        onCreated={handlePromoCreated}
        onRequestClose={closePromoSheet}
        onUpdated={(updated) => {
          updatePromo(updated.id, updated);
          closePromoSheet();
        }}
      />

      <CreateSaleSheet
        editCampaign={editSale}
        visible={saleCreateVisible || editSale != null}
        onCreated={handleSaleCreated}
        onRequestClose={closeSaleSheet}
        onUpdated={(updated) => {
          updateSale(updated.id, updated);
          closeSaleSheet();
        }}
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
