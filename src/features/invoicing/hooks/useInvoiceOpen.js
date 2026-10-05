import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import { shopProfileQueryOptions } from '../../shop/shopProfileQueryOptions';
import { useSubscription } from '../../subscription';
import { fetchInvoiceForOpen, invoiceBusinessName } from '../api/invoiceOpen';
import { useInvoiceAccess } from './useInvoiceAccess';
import { invoiceOpenQueryKey } from '../queryKeys';

/**
 * Opens one invoice. A miss is `shouldLeave` so the screen returns to the list.
 *
 * @param {string | undefined} invoiceId
 */
export function useInvoiceOpen(invoiceId) {
  const id = String(invoiceId ?? '').trim();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const businessQ = useQuery(shopProfileQueryOptions(userId));
  const { loadError: subscriptionError } = useSubscription();
  const access = useInvoiceAccess();

  const businessId = businessQ.data?.id ?? null;
  const allowed = Boolean(userId) && access.canSeeInvoices;
  const openQ = useQuery({
    queryKey: invoiceOpenQueryKey(businessId, id),
    queryFn: () => fetchInvoiceForOpen(businessId, id),
    enabled: allowed && Boolean(businessId) && Boolean(id),
    staleTime: 30 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const gatesPending = Boolean(userId) && (!access.isReady || (allowed && businessQ.isPending));
  const isLoading =
    Boolean(id) && (gatesPending || (allowed && Boolean(businessId) && openQ.isPending));
  const outcome = openQ.data?.outcome ?? null;
  const opened = outcome === 'draft' || outcome === 'bill';

  return {
    isLoading,
    shouldLeave:
      !isLoading &&
      (!id ||
        !allowed ||
        Boolean(subscriptionError) ||
        businessQ.isError ||
        openQ.isError ||
        outcome === 'leave' ||
        (allowed && !businessId)),
    outcome: opened ? outcome : null,
    draft: openQ.data?.draft ?? null,
    invoice: openQ.data?.invoice ?? null,
    businessName: invoiceBusinessName(businessQ.data?.business_name),
  };
}
