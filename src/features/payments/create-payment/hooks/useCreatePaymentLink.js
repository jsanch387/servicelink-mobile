import { useCallback, useState } from 'react';
import { useToast } from '../../../../components/ui';
import { postCreatePaymentLink } from '../api/postCreatePaymentLink';
import {
  hasCreatePaymentNote,
  parseCreatePaymentAmount,
  sanitizeCreatePaymentNote,
} from '../utils/createPaymentAmount';

/**
 * Creates a walk-up Stripe pay link (no booking).
 */
export function useCreatePaymentLink({ accessToken, amount, note, chargeCents = null }) {
  const toast = useToast();
  const [creating, setCreating] = useState(false);

  const createLink = useCallback(async () => {
    if (creating) {
      return null;
    }
    const parsedAmount = parseCreatePaymentAmount(amount);
    if (parsedAmount == null || !hasCreatePaymentNote(note)) {
      return null;
    }
    if (!accessToken) {
      toast.error('Sign in again to create a payment link.');
      return null;
    }

    setCreating(true);
    try {
      const amountCents =
        chargeCents != null && Number.isFinite(Number(chargeCents)) && Number(chargeCents) > 0
          ? Math.round(Number(chargeCents))
          : Math.round(parsedAmount * 100);
      const result = await postCreatePaymentLink(accessToken, {
        amountCents,
        note: sanitizeCreatePaymentNote(note),
      });
      if (!result.ok) {
        toast.error(result.error.message);
        return null;
      }
      return result.url;
    } finally {
      setCreating(false);
    }
  }, [accessToken, amount, chargeCents, creating, note, toast]);

  return { createLink, creating };
}
