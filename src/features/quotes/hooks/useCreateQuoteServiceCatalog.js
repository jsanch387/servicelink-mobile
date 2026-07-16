import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ownerHasProAccess } from '../../bookingLink/api/bookingLink';
import { fetchActivePriceOptionsForService } from '../../bookings/create-appointment/api/priceOptions';
import {
  buildCreateFlowPricingOptions,
  isServicePriceTiersEnabled,
} from '../../bookings/create-appointment/utils/createFlowPricing';
import { fetchAccountSettingsBundle } from '../../more/api/fetchAccountSettings';
import { catalogAddonsForService } from '../../services/utils/catalogAddonsForService';
import { useServicesCatalog } from '../../services/hooks/useServicesCatalog';

/**
 * Live services catalog + pricing options / add-ons for create-quote.
 *
 * @param {{
 *   userId: string | null | undefined;
 *   selectedServiceId: string | null;
 *   isCustomJob: boolean;
 * }} args
 */
export function useCreateQuoteServiceCatalog({ userId, selectedServiceId, isCustomJob }) {
  const catalog = useServicesCatalog();

  const ownerQ = useQuery({
    queryKey: ['createQuote', 'ownerProfile', userId],
    queryFn: async () => {
      const bundle = await fetchAccountSettingsBundle(userId);
      if (bundle.error) throw bundle.error;
      return bundle.ownerProfile;
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });

  const ownerHasPro = ownerHasProAccess(ownerQ.data ?? null);

  const catalogServices = useMemo(
    () => (catalog.services ?? []).filter((s) => s?.isEnabled !== false),
    [catalog.services],
  );

  const selectedServiceRow = useMemo(() => {
    if (!selectedServiceId || isCustomJob) return null;
    return (
      (catalog.serviceRows ?? []).find((r) => String(r.id) === String(selectedServiceId)) ?? null
    );
  }, [catalog.serviceRows, isCustomJob, selectedServiceId]);

  const selectedCatalogService = useMemo(() => {
    if (!selectedServiceId || isCustomJob) return null;
    return catalogServices.find((s) => String(s.id) === String(selectedServiceId)) ?? null;
  }, [catalogServices, isCustomJob, selectedServiceId]);

  const priceOptionsEnabled = isServicePriceTiersEnabled(selectedServiceRow);

  const priceOptionsQ = useQuery({
    queryKey: ['createQuote', 'priceOptions', catalog.businessId, selectedServiceId],
    queryFn: async () => {
      const { data, error } = await fetchActivePriceOptionsForService(
        catalog.businessId,
        selectedServiceId,
      );
      if (error) throw new Error(error.message ?? 'Could not load pricing options');
      return data ?? [];
    },
    enabled: Boolean(
      catalog.businessId && selectedServiceId && !isCustomJob && priceOptionsEnabled && ownerHasPro,
    ),
    staleTime: 45 * 1000,
  });

  const priceOptionsLoading = Boolean(
    ownerHasPro && priceOptionsEnabled && priceOptionsQ.isPending,
  );

  const pricingPayload = useMemo(() => {
    if (priceOptionsLoading && !(priceOptionsQ.data ?? []).length) {
      return { options: [], labelKey: 'label' };
    }
    return buildCreateFlowPricingOptions(selectedServiceRow, priceOptionsQ.data ?? [], ownerHasPro);
  }, [ownerHasPro, priceOptionsLoading, priceOptionsQ.data, selectedServiceRow]);

  const addonsForSelectedService = useMemo(
    () => catalogAddonsForService(selectedServiceId, catalog.addons, catalog.addonAssignments),
    [catalog.addonAssignments, catalog.addons, selectedServiceId],
  );

  return {
    businessId: catalog.businessId,
    catalogLoading: catalog.isLoading,
    catalogError: catalog.catalogError || catalog.businessError,
    catalogCategories: catalog.categories ?? [],
    catalogServices,
    selectedCatalogService,
    selectedServiceRow,
    pricingOptions: pricingPayload.options,
    priceOptionsLoading,
    addonsForSelectedService,
  };
}
