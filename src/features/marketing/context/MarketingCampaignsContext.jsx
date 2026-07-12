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
  const { campaigns, addCampaign, updateCampaign, deleteCampaign, getCampaignById } =
    useMarketingCampaigns();
  return useMemo(
    () => ({
      promos: selectPromoCodes(campaigns),
      addPromo: (promo) => addCampaign({ ...promo, kind: MARKETING_CAMPAIGN_KIND.PROMO_CODE }),
      updatePromo: (id, patch) => updateCampaign(id, patch),
      deletePromo: deleteCampaign,
      getPromoById: (id) => {
        const c = getCampaignById(id);
        return c?.kind === MARKETING_CAMPAIGN_KIND.PROMO_CODE ? c : null;
      },
    }),
    [addCampaign, campaigns, deleteCampaign, getCampaignById, updateCampaign],
  );
}

export function useSales() {
  const { campaigns, addCampaign, updateCampaign, deleteCampaign, getCampaignById } =
    useMarketingCampaigns();
  return useMemo(
    () => ({
      sales: selectSales(campaigns),
      addSale: (sale) => addCampaign({ ...sale, kind: MARKETING_CAMPAIGN_KIND.SALE }),
      updateSale: (id, patch) => updateCampaign(id, patch),
      deleteSale: deleteCampaign,
      getSaleById: (id) => {
        const c = getCampaignById(id);
        return c?.kind === MARKETING_CAMPAIGN_KIND.SALE ? c : null;
      },
    }),
    [addCampaign, campaigns, deleteCampaign, getCampaignById, updateCampaign],
  );
}
