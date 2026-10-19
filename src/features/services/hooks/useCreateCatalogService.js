import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceDurationHHmmToMinutes } from '../../../components/ui/durationTime';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import {
  detectPriceOptionLabelColumn,
  fetchServicePriceOptions,
  insertBusinessService,
  insertServiceAddon,
  saveServiceEditorChanges,
} from '../api/services';
import { SERVICES_QUERY_ROOT, servicesCatalogQueryKey } from '../queryKeys';
import { normalizeAddonDurationHHmm } from '../utils/serviceAddonModel';

async function invalidateServiceCatalog(queryClient, businessId, userId) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: servicesCatalogQueryKey(businessId) }),
    queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_ROOT }),
    queryClient.invalidateQueries({ queryKey: homeBusinessProfileQueryKey(userId) }),
  ]);
}

/**
 * Creates the service, then attaches other prices and add-ons when the draft includes them.
 * If the service row is saved but extras fail, the thrown error includes `serviceId`.
 */
async function attachServiceExtras({ businessId, serviceId, draft }) {
  const pendingAddons = (draft.pendingAddons ?? []).filter((addon) => addon.selected);
  const createdIdsByLocalId = new Map();

  for (const addon of pendingAddons) {
    const durationHHmm = normalizeAddonDurationHHmm(addon.durationHHmm);
    const durationMinutes = durationHHmm ? serviceDurationHHmmToMinutes(durationHHmm) : 0;
    const { data, error } = await insertServiceAddon({
      businessId,
      name: addon.name,
      priceInput: addon.price,
      durationMinutes,
      description: addon.description,
    });
    if (error) throw new Error(error.message ?? 'Could not create add-on');
    if (!data?.id) throw new Error('Could not create add-on');
    createdIdsByLocalId.set(addon.localId, String(data.id));
  }

  const selectedPendingIds = pendingAddons
    .map((addon) => createdIdsByLocalId.get(addon.localId))
    .filter(Boolean);
  const selectedAddonIds = [...(draft.selectedAddonIds ?? []).map(String), ...selectedPendingIds];
  const savePrices = Boolean(draft.multiPriceEnabled) && (draft.pricingOptions?.length ?? 0) > 0;
  if (!savePrices && selectedAddonIds.length === 0) return;

  let priceOptionLabelKey = 'label';
  if (savePrices) {
    const { data: optionRows } = await fetchServicePriceOptions(businessId);
    priceOptionLabelKey = detectPriceOptionLabelColumn(optionRows?.[0]);
  }

  const { error } = await saveServiceEditorChanges({
    businessId,
    serviceId,
    serviceDetails: {
      serviceName: draft.name,
      description: draft.description,
      price: draft.price,
      durationMinutes: serviceDurationHHmmToMinutes(draft.durationHHmm),
    },
    multiPriceEnabled: savePrices,
    pricingOptions: savePrices
      ? draft.pricingOptions.map((option) => ({
          id: option.id,
          label: option.label,
          price: option.price,
          durationMinutes: serviceDurationHHmmToMinutes(option.durationHHmm),
        }))
      : [],
    selectedAddonIds,
    priceOptionLabelKey,
    categoryId: draft.categoryId?.trim() || null,
  });
  if (error) throw new Error(error.message ?? 'Could not save service options');
}

export function useCreateCatalogService({ businessId, userId }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (draft) => {
      const { data, error } = await insertBusinessService({
        businessId,
        name: draft.name,
        description: draft.description,
        priceInput: draft.price,
        durationMinutes: serviceDurationHHmmToMinutes(draft.durationHHmm),
        categoryId: draft.categoryId?.trim() || null,
      });
      if (error) throw new Error(error.message ?? 'Could not create service');
      if (!data?.id) throw new Error('Could not create service');

      try {
        await attachServiceExtras({ businessId, serviceId: data.id, draft });
      } catch (extrasError) {
        const wrapped = new Error(
          extrasError?.message ?? 'Other prices or add-ons could not be saved.',
        );
        wrapped.serviceId = data.id;
        throw wrapped;
      }

      return data;
    },
    onSuccess: async () => {
      await invalidateServiceCatalog(queryClient, businessId, userId);
    },
    onError: async (error) => {
      if (!error?.serviceId) return;
      await invalidateServiceCatalog(queryClient, businessId, userId);
    },
  });

  return {
    createCatalogService: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
}
