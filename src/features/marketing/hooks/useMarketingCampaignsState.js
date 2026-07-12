import { useCallback, useMemo, useState } from 'react';

/**
 * UI-only local state for marketing campaigns until backend is wired.
 */
export function useMarketingCampaignsState() {
  const [campaigns, setCampaigns] = useState(
    /** @type {import('../utils/marketingCampaignModel').MarketingCampaign[]} */ ([]),
  );

  const addCampaign = useCallback((campaign) => {
    setCampaigns((prev) => [campaign, ...prev]);
  }, []);

  const updateCampaign = useCallback((id, patch) => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch, id: c.id } : c)));
  }, []);

  const deleteCampaign = useCallback((id) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getCampaignById = useCallback(
    (id) => campaigns.find((c) => c.id === id) ?? null,
    [campaigns],
  );

  return useMemo(
    () => ({
      campaigns,
      addCampaign,
      updateCampaign,
      deleteCampaign,
      getCampaignById,
    }),
    [addCampaign, campaigns, deleteCampaign, getCampaignById, updateCampaign],
  );
}
