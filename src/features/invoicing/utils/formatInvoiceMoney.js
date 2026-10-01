/** Document amounts always show cents (`$200.00`). */
export function formatInvoiceDocumentDollars(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '$0.00';
  return (Math.round(n * 100) / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Format a dollar amount for invoice totals (`$72` or `$48.27`). */
export function formatInvoiceDollars(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '$0';
  const cents = Math.round(n * 100);
  const showCents = cents % 100 !== 0;
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });
}
