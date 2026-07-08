function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function numberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {unknown} line
 * @param {number} idx
 */
function mapSnapshotFeeLine(line, idx) {
  const cents = numberOrZero(
    line?.amountCents ?? line?.amount_cents ?? line?.priceCents ?? line?.price_cents,
  );
  const label =
    String(line?.label ?? line?.name ?? line?.title ?? '').trim() || `Additional fee ${idx + 1}`;
  return {
    id: String(line?.id ?? `invoice-fee-${idx + 1}`),
    name: label,
    price: cents / 100,
  };
}

function isSessionFeeLine(line) {
  const type = String(line?.type ?? line?.kind ?? '')
    .trim()
    .toLowerCase();
  const source = String(line?.source ?? '')
    .trim()
    .toLowerCase();
  return (
    type === 'session_fee' ||
    type === 'session_fees' ||
    source === 'owner_complete_screen' ||
    line?.isSessionFee === true ||
    line?.is_session_fee === true
  );
}

/**
 * Reads owner-added checkout fees from `booking_invoices.snapshot_json` when fee line rows
 * are unavailable to the mobile client (RLS) or not yet synced.
 *
 * @param {unknown} snapshot
 * @returns {Array<{ id: string; name: string; price: number }>}
 */
export function parseSessionFeesFromInvoiceSnapshot(snapshot) {
  if (!snapshot) {
    return [];
  }

  const root = typeof snapshot === 'string' ? safeJsonParse(snapshot) : snapshot;
  if (!root || typeof root !== 'object') {
    return [];
  }

  const directArrays = [root.sessionFees, root.session_fees, root.fees].filter(Array.isArray);
  for (const arr of directArrays) {
    const mapped = arr.map(mapSnapshotFeeLine).filter((item) => item.price >= 0);
    if (mapped.length > 0) {
      return mapped;
    }
  }

  const lineArrays = [root.lines, root.lineItems, root.line_items].filter(Array.isArray);
  for (const arr of lineArrays) {
    const mapped = arr
      .filter(isSessionFeeLine)
      .map(mapSnapshotFeeLine)
      .filter((item) => item.price >= 0);
    if (mapped.length > 0) {
      return mapped;
    }
  }

  return [];
}
