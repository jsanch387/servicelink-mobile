import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import {
  deletePromoCode,
  fetchPromoCodesForBusiness,
  insertPromoCode,
  togglePromoCodeActive,
  updatePromoCode,
} from '../api/promoCodes';
import {
  deleteSale,
  fetchSalesForBusiness,
  insertSale,
  toggleSaleActive,
  updateSale,
} from '../api/sales';
import { MARKETING_CAMPAIGN_KIND } from '../constants';
import { marketingPromoCodesQueryKey, marketingSalesQueryKey } from '../queryKeys';
import { marketingErrorMessage } from '../utils/marketingDbMap';

/**
 * Loads promo codes + sales from Supabase and exposes async mutations.
 */
export function useMarketingCampaignsState() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const businessQ = useQuery({
    queryKey: homeBusinessProfileQueryKey(userId),
    queryFn: async () => {
      const { data, error } = await fetchBusinessProfileForUser(userId);
      if (error) {
        throw new Error(error.message ?? 'Could not load business');
      }
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const businessId = businessQ.data?.id ?? null;
  const hasBusiness = Boolean(businessId);

  const promosQ = useQuery({
    queryKey: marketingPromoCodesQueryKey(businessId),
    queryFn: async () => {
      const { data, error } = await fetchPromoCodesForBusiness(businessId);
      if (error) {
        throw new Error(error.message ?? 'Could not load promo codes');
      }
      return data ?? [];
    },
    enabled: hasBusiness,
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const salesQ = useQuery({
    queryKey: marketingSalesQueryKey(businessId),
    queryFn: async () => {
      const { data, error } = await fetchSalesForBusiness(businessId);
      if (error) {
        throw new Error(error.message ?? 'Could not load sales');
      }
      return data ?? [];
    },
    enabled: hasBusiness,
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const campaigns = useMemo(
    () => [...(promosQ.data ?? []), ...(salesQ.data ?? [])],
    [promosQ.data, salesQ.data],
  );

  const invalidateMarketing = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: marketingPromoCodesQueryKey(businessId) }),
      queryClient.invalidateQueries({ queryKey: marketingSalesQueryKey(businessId) }),
    ]);
  }, [businessId, queryClient]);

  const addCampaign = useCallback(
    async (campaign) => {
      if (!businessId) {
        return { data: null, error: new Error('Business profile not found.') };
      }

      if (campaign.kind === MARKETING_CAMPAIGN_KIND.SALE) {
        const result = await insertSale({ businessId, campaign });
        if (!result.error) await invalidateMarketing();
        return result;
      }

      const result = await insertPromoCode({ businessId, campaign });
      if (!result.error) {
        queryClient.setQueryData(marketingPromoCodesQueryKey(businessId), (old) => {
          const list = Array.isArray(old) ? old : [];
          return result.data ? [result.data, ...list.filter((c) => c.id !== result.data.id)] : list;
        });
      }
      return result;
    },
    [businessId, invalidateMarketing, queryClient],
  );

  const updateCampaign = useCallback(
    async (id, campaign) => {
      if (!businessId) {
        return { data: null, error: new Error('Business profile not found.') };
      }

      const existing = campaigns.find((c) => c.id === id);
      const kind = campaign.kind ?? existing?.kind;

      if (kind === MARKETING_CAMPAIGN_KIND.SALE) {
        const result = await updateSale({
          businessId,
          saleId: id,
          campaign: { ...existing, ...campaign, id, kind: MARKETING_CAMPAIGN_KIND.SALE },
        });
        if (!result.error) await invalidateMarketing();
        return result;
      }

      const result = await updatePromoCode({
        businessId,
        promoId: id,
        campaign: {
          ...existing,
          ...campaign,
          id,
          kind: MARKETING_CAMPAIGN_KIND.PROMO_CODE,
        },
      });
      if (!result.error) {
        queryClient.setQueryData(marketingPromoCodesQueryKey(businessId), (old) => {
          const list = Array.isArray(old) ? old : [];
          return list.map((c) => (c.id === id ? result.data : c));
        });
      }
      return result;
    },
    [businessId, campaigns, invalidateMarketing, queryClient],
  );

  const toggleCampaignEnabled = useCallback(
    async (id, isEnabled) => {
      if (!businessId) {
        return { data: null, error: new Error('Business profile not found.') };
      }

      const existing = campaigns.find((c) => c.id === id);
      if (!existing) {
        return { data: null, error: new Error('Offer not found.') };
      }

      if (existing.kind === MARKETING_CAMPAIGN_KIND.SALE) {
        const result = await toggleSaleActive({ businessId, saleId: id, isActive: isEnabled });
        if (!result.error) {
          queryClient.setQueryData(marketingSalesQueryKey(businessId), (old) => {
            const list = Array.isArray(old) ? old : [];
            return list.map((c) => {
              if (c.id === id) return result.data ?? { ...c, isEnabled };
              if (isEnabled) return { ...c, isEnabled: false };
              return c;
            });
          });
        }
        return result;
      }

      const result = await togglePromoCodeActive({
        businessId,
        promoId: id,
        isActive: isEnabled,
      });
      if (!result.error) {
        queryClient.setQueryData(marketingPromoCodesQueryKey(businessId), (old) => {
          const list = Array.isArray(old) ? old : [];
          return list.map((c) => (c.id === id ? result.data : c));
        });
      }
      return result;
    },
    [businessId, campaigns, queryClient],
  );

  const deleteCampaign = useCallback(
    async (id) => {
      if (!businessId) {
        return { error: new Error('Business profile not found.') };
      }

      const existing = campaigns.find((c) => c.id === id);
      if (!existing) {
        return { error: new Error('Offer not found.') };
      }

      if (existing.kind === MARKETING_CAMPAIGN_KIND.SALE) {
        const result = await deleteSale({ businessId, saleId: id });
        if (!result.error) {
          queryClient.setQueryData(marketingSalesQueryKey(businessId), (old) => {
            const list = Array.isArray(old) ? old : [];
            return list.filter((c) => c.id !== id);
          });
        }
        return result;
      }

      const result = await deletePromoCode({ businessId, promoId: id });
      if (!result.error) {
        queryClient.setQueryData(marketingPromoCodesQueryKey(businessId), (old) => {
          const list = Array.isArray(old) ? old : [];
          return list.filter((c) => c.id !== id);
        });
      }
      return result;
    },
    [businessId, campaigns, queryClient],
  );

  const getCampaignById = useCallback(
    (id) => campaigns.find((c) => c.id === id) ?? null,
    [campaigns],
  );

  const refetch = useCallback(async () => {
    await Promise.all([promosQ.refetch(), salesQ.refetch(), businessQ.refetch()]);
  }, [businessQ, promosQ, salesQ]);

  const isLoading =
    Boolean(userId) &&
    (businessQ.isLoading || (hasBusiness && (promosQ.isLoading || salesQ.isLoading)));

  const errorMessage =
    businessQ.error?.message || promosQ.error?.message || salesQ.error?.message || null;

  return useMemo(
    () => ({
      campaigns,
      businessId,
      isLoading,
      isRefreshing: promosQ.isFetching || salesQ.isFetching,
      errorMessage: errorMessage ? marketingErrorMessage({ message: errorMessage }) : null,
      refetch,
      addCampaign,
      updateCampaign,
      toggleCampaignEnabled,
      deleteCampaign,
      getCampaignById,
    }),
    [
      addCampaign,
      businessId,
      campaigns,
      deleteCampaign,
      errorMessage,
      getCampaignById,
      isLoading,
      promosQ.isFetching,
      refetch,
      salesQ.isFetching,
      toggleCampaignEnabled,
      updateCampaign,
    ],
  );
}
