import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { ROUTES } from '../../../routes/routes';
import { useInvoiceAccess } from './useInvoiceAccess';

/**
 * Sends a direct open (notification, leftover stack) back when this login
 * cannot use invoices. The list screen stays open for the subscribe card.
 */
export function useLeaveWhenInvoicesHidden() {
  const navigation = useNavigation();
  const access = useInvoiceAccess();

  useEffect(() => {
    if (!access.isReady || access.canUseInvoices) return undefined;
    const timeout = setTimeout(() => {
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate(ROUTES.MAIN_APP, { screen: ROUTES.MORE });
    }, 0);
    return () => clearTimeout(timeout);
  }, [access.canUseInvoices, access.isReady, navigation]);

  return access;
}
