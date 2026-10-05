import { INVOICE_STATUS } from '../constants/invoiceStatuses';

/**
 * Pill colors for an invoice status. Muted is draft or voided, blue means
 * sent, green means paid.
 *
 * @param {string | undefined} status
 * @param {{ borderStrong: string; border: string; text: string; textMuted: string; textSecondary: string }} colors
 * @param {boolean} isDark
 * @returns {{ backgroundColor: string; borderColor: string; color: string }}
 */
export function getInvoiceStatusPillTheme(status, colors, isDark) {
  const s = String(status ?? '').toLowerCase();

  const muted = {
    backgroundColor: isDark ? 'rgba(250,250,250,0.06)' : 'rgba(10,10,10,0.05)',
    borderColor: colors.borderStrong,
    color: colors.textSecondary,
  };

  if (s === INVOICE_STATUS.SENT) {
    return {
      backgroundColor: isDark ? 'rgba(96,165,250,0.14)' : 'rgba(37,99,235,0.1)',
      borderColor: isDark ? 'rgba(147,197,253,0.45)' : 'rgba(37,99,235,0.28)',
      color: isDark ? '#93c5fd' : '#1d4ed8',
    };
  }

  if (s === INVOICE_STATUS.PAID) {
    return {
      backgroundColor: isDark ? 'rgba(34,197,94,0.16)' : 'rgba(22,163,74,0.12)',
      borderColor: isDark ? 'rgba(74,222,128,0.45)' : 'rgba(22,163,74,0.28)',
      color: isDark ? '#86efac' : '#15803d',
    };
  }

  if (s === INVOICE_STATUS.DRAFT || s === INVOICE_STATUS.VOID || s === INVOICE_STATUS.VOIDED) {
    return {
      backgroundColor: isDark ? 'rgba(250,250,250,0.05)' : 'rgba(10,10,10,0.04)',
      borderColor: colors.border,
      color: colors.textMuted,
    };
  }

  return muted;
}
