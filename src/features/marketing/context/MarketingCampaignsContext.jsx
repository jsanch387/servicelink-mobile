import { createContext, useContext, useMemo } from 'react';
import { MARKETING_CAMPAIGN_KIND } from '../constants';
import { useMarketingCampaignsState } from '../hooks/useMarketingCampaignsState';

/** @type {ReturnType<typeof useMarketingCampaignsState> | null} */
const MarketingCampaignsContext = createContext(null);

export function MarketingCampaignsProvider({ children }) {
  const value = useMarketingCampaignsState();
  return (
    <MarketingCampaignsContext.Provider value={value}>
      {children}
    </MarketingCampaignsContext.Provider>
  );
}

export function useMarketingCampaigns() {
  const ctx = useContext(MarketingCampaignsContext);
  if (!ctx) {
    throw new Error('useMarketingCampaigns must be used within MarketingCampaignsProvider');
  }
  return ctx;
}

/**
 * @param {import('../utils/marketingCampaignModel').MarketingCampaign[]} campaigns
 */
export function selectPromoCodes(campaigns) {
  return campaigns.filter((c) => c.kind === MARKETING_CAMPAIGN_KIND.PROMO_CODE);
}

/**
 * @param {import('../utils/marketingCampaignModel').MarketingCampaign[]} campaigns
 */
export function selectSales(campaigns) {
  return campaigns.filter((c) => c.kind === MARKETING_CAMPAIGN_KIND.SALE);
}

export function usePromoCodes() {
  const {
    campaigns,
    addCampaign,
    updateCampaign,
    toggleCampaignEnabled,
    deleteCampaign,
    getCampaignById,
    businessId,
    isLoading,
    isRefreshing,
    errorMessage,
    refetch,
  } = useMarketingCampaigns();

  return useMemo(
    () => ({
      promos: selectPromoCodes(campaigns),
      businessId,
      isLoading,
      isRefreshing,
      errorMessage,
      refetch,
      addPromo: (promo) => addCampaign({ ...promo, kind: MARKETING_CAMPAIGN_KIND.PROMO_CODE }),
      updatePromo: (id, campaign) =>
        updateCampaign(id, { ...campaign, kind: MARKETING_CAMPAIGN_KIND.PROMO_CODE }),
      togglePromoEnabled: (id, isEnabled) => toggleCampaignEnabled(id, isEnabled),
      deletePromo: deleteCampaign,
      getPromoById: (id) => {
        const c = getCampaignById(id);
        return c?.kind === MARKETING_CAMPAIGN_KIND.PROMO_CODE ? c : null;
      },
    }),
    [
      addCampaign,
      businessId,
      campaigns,
      deleteCampaign,
      errorMessage,
      getCampaignById,
      isLoading,
      isRefreshing,
      refetch,
      toggleCampaignEnabled,
      updateCampaign,
    ],
  );
}

export function useSales() {
  const {
    campaigns,
    addCampaign,
    updateCampaign,
    toggleCampaignEnabled,
    deleteCampaign,
    getCampaignById,
    businessId,
    isLoading,
    isRefreshing,
    errorMessage,
    refetch,
  } = useMarketingCampaigns();

  return useMemo(
    () => ({
      sales: selectSales(campaigns),
      businessId,
      isLoading,
      isRefreshing,
      errorMessage,
      refetch,
      addSale: (sale) => addCampaign({ ...sale, kind: MARKETING_CAMPAIGN_KIND.SALE }),
      updateSale: (id, campaign) =>
        updateCampaign(id, { ...campaign, kind: MARKETING_CAMPAIGN_KIND.SALE }),
      toggleSaleEnabled: (id, isEnabled) => toggleCampaignEnabled(id, isEnabled),
      deleteSale: deleteCampaign,
      getSaleById: (id) => {
        const c = getCampaignById(id);
        return c?.kind === MARKETING_CAMPAIGN_KIND.SALE ? c : null;
      },
    }),
    [
      addCampaign,
      businessId,
      campaigns,
      deleteCampaign,
      errorMessage,
      getCampaignById,
      isLoading,
      isRefreshing,
      refetch,
      toggleCampaignEnabled,
      updateCampaign,
    ],
  );
}
