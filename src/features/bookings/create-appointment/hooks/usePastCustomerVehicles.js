import { useQuery } from '@tanstack/react-query';
import { fetchCustomerAssetsForBusiness } from '../../../customers/api/customerAssets';
import { findCustomerIdByContact } from '../../../customers/api/customers';
import { customerAssetsQueryKey, customerLookupQueryKey } from '../../../customers/queryKeys';
import { mapCustomerAssetsToPastVehicles } from '../../../customers/utils/mapCustomerAssetToVehicle';
import { normalizeEmailForDedupe } from '../../../../utils/email';
import { normalizePhoneForDatabase } from '../../../../utils/phone';

/**
 * Loads saved vehicles for a returning customer.
 * Uses a known CRM id when the visit was launched from their profile; otherwise
 * matches the typed phone (then email) so the main create-appointment flow can
 * recommend the same past vehicles.
 *
 * @param {{
 *   businessId?: string | null;
 *   customerId?: string | null;
 *   phone?: string | null;
 *   email?: string | null;
 * }} args
 */
export function usePastCustomerVehicles({
  businessId = null,
  customerId = null,
  phone = '',
  email = '',
} = {}) {
  const bid = String(businessId ?? '').trim();
  const knownId = String(customerId ?? '').trim();
  const phoneNorm = normalizePhoneForDatabase(phone);
  const emailNorm = normalizeEmailForDedupe(email);

  const lookupQ = useQuery({
    queryKey: customerLookupQueryKey(bid, phoneNorm, emailNorm),
    queryFn: async () => {
      const { customerId: matchedId, error } = await findCustomerIdByContact(bid, {
        phone: phoneNorm,
        email: emailNorm,
      });
      if (error) {
        throw error;
      }
      return matchedId;
    },
    enabled: Boolean(bid) && !knownId && Boolean(phoneNorm || emailNorm),
    staleTime: 45 * 1000,
    retry: false,
  });

  const effectiveCustomerId = knownId || lookupQ.data || '';

  const assetsQ = useQuery({
    queryKey: customerAssetsQueryKey(bid, effectiveCustomerId),
    queryFn: async () => {
      const { data, error } = await fetchCustomerAssetsForBusiness(bid, effectiveCustomerId, {
        assetType: 'vehicle',
      });
      if (error) {
        throw error;
      }
      return mapCustomerAssetsToPastVehicles(data);
    },
    enabled: Boolean(bid && effectiveCustomerId),
    staleTime: 45 * 1000,
    retry: false,
  });

  return {
    pastVehicles: assetsQ.data ?? [],
    isLoading: lookupQ.isFetching || assetsQ.isFetching,
  };
}
