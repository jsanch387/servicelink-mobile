import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useShopTaxSettings } from '../../payments/hooks/useShopTaxSettings';
import { fetchBookingInvoiceTax } from '../api/fetchBookingInvoiceTax';
import { INVOICES_QUERY_ROOT } from '../queryKeys';
import { previewInvoiceTax } from '../utils/invoiceTaxPreview';

/**
 * @param {string | null | undefined} bookingId
 */
function bookingInvoiceTaxQueryKey(bookingId) {
  return [...INVOICES_QUERY_ROOT, 'booking-tax', bookingId || 'none'];
}

/**
 * Preview tax for the invoice being composed. Does not write tax.
 *
 * @param {{
 *   businessId?: string | null;
 *   bookingId?: string | null;
 *   subtotalCents?: number;
 * }} args
 */
export function useInvoiceTaxPreview({ businessId, bookingId, subtotalCents = 0 }) {
  const booking = String(bookingId ?? '').trim();
  const shop = useShopTaxSettings(booking ? null : businessId);
  const bookingTax = useQuery({
    queryKey: bookingInvoiceTaxQueryKey(booking),
    queryFn: () => fetchBookingInvoiceTax(booking),
    enabled: Boolean(booking),
    staleTime: 30 * 1000,
  });

  return useMemo(() => {
    if (booking) {
      if (!bookingTax.data) {
        return previewInvoiceTax({ subtotalCents, bookingPayment: { found: false, taxCents: 0 } });
      }
      return previewInvoiceTax({ subtotalCents, bookingPayment: bookingTax.data });
    }
    return previewInvoiceTax({
      subtotalCents,
      shopTaxEnabled: shop.taxEnabled,
      shopTaxRateBps: shop.taxRateBps,
    });
  }, [booking, bookingTax.data, shop.taxEnabled, shop.taxRateBps, subtotalCents]);
}
