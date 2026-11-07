import { useQuery } from '@tanstack/react-query';
import { fetchShopTaxSettings } from '../api/fetchShopTaxSettings';
import { PAYMENTS_QUERY_ROOT } from '../queryKeys';

/**
 * @param {string | null | undefined} businessId
 */
export function shopTaxSettingsQueryKey(businessId) {
  return [...PAYMENTS_QUERY_ROOT, 'shop-tax', businessId || 'none'];
}

/**
 * Current shop rate for previews. Off when the row is missing, tax is disabled, or the read fails.
 *
 * @param {string | null | undefined} businessId
 */
export function useShopTaxSettings(businessId) {
  const id = String(businessId ?? '').trim();
  const query = useQuery({
    queryKey: shopTaxSettingsQueryKey(id),
    queryFn: () => fetchShopTaxSettings(id),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });

  const bps = Math.round(Number(query.data?.tax_rate_bps));
  const hasRate = Number.isFinite(bps) && bps >= 1;

  return {
    taxEnabled: Boolean(query.data?.tax_enabled) && hasRate,
    taxRateBps: hasRate ? bps : null,
    isPending: Boolean(id) && query.isLoading,
  };
}
