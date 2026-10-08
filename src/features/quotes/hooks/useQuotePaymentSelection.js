import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePaymentDashboardRead } from '../../payments/hooks/usePaymentDashboardRead';
import {
  availableQuotePaymentMethods,
  isQuotePaymentMethodAvailable,
  orderQuotePaymentMethods,
  quotePaymentCustomerChooses,
  quotePaymentSelectionSummary,
  resolveQuotePaymentAvailability,
  toggleQuotePaymentMethod,
} from '../utils/quotePaymentOptions';

/**
 * Payment choices for one quote. Nothing is selected until the owner picks.
 */
export function useQuotePaymentSelection() {
  const payment = usePaymentDashboardRead();
  const [methods, setMethods] = useState([]);

  const loading = payment.isPendingBusiness || payment.isPendingPayments;
  const loadError = payment.paymentLoadError || payment.businessError;

  const availability = useMemo(
    () =>
      resolveQuotePaymentAvailability({
        stripeConnectReady: payment.stripeConnectReady,
        paymentsEnabled: payment.formHydration.paymentsEnabled,
        requireDeposits: payment.formHydration.requireDeposits,
        depositMode: payment.formHydration.depositMode,
        depositAmount: payment.formHydration.depositAmount,
      }),
    [
      payment.formHydration.depositAmount,
      payment.formHydration.depositMode,
      payment.formHydration.paymentsEnabled,
      payment.formHydration.requireDeposits,
      payment.stripeConnectReady,
    ],
  );

  useEffect(() => {
    setMethods((current) =>
      orderQuotePaymentMethods(current).filter((id) =>
        isQuotePaymentMethodAvailable(id, availability),
      ),
    );
  }, [availability]);

  const availableMethods = useMemo(
    () => availableQuotePaymentMethods(availability),
    [availability],
  );

  const customerChooses = quotePaymentCustomerChooses(methods, availability);

  const toggleMethod = useCallback(
    (methodId) => {
      if (!isQuotePaymentMethodAvailable(methodId, availability)) return;
      setMethods((current) => toggleQuotePaymentMethod(current, methodId));
    },
    [availability],
  );

  const toggleCustomerChooses = useCallback(() => {
    setMethods((current) => {
      const available = availableQuotePaymentMethods(availability);
      if (available.length < 2) return current;
      const allOn = available.every((id) => current.includes(id));
      return allOn ? [] : available;
    });
  }, [availability]);

  return {
    methods,
    availability,
    loading,
    loadError,
    summary: quotePaymentSelectionSummary(methods),
    customerChooses,
    showCustomerChooses: availableMethods.length > 1,
    toggleMethod,
    toggleCustomerChooses,
    retry: payment.refetchPayments,
  };
}
