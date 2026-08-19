/**
 * Prefer an active-list membership for a CRM customer, else any row.
 *
 * @param {Array<{ id: string; customerId?: string | null; isActiveList?: boolean }> | null | undefined} subscribers
 * @param {string | null | undefined} customerId
 */
export function findSubscriberForCustomer(subscribers, customerId) {
  const id = String(customerId ?? '').trim();
  if (!id) return null;
  const rows = (Array.isArray(subscribers) ? subscribers : []).filter(
    (row) => String(row.customerId ?? '').trim() === id,
  );
  if (rows.length === 0) return null;
  return rows.find((row) => row.isActiveList) ?? rows[0] ?? null;
}
