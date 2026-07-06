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
 * @param {unknown} addonDetails
 * @returns {Array<{ id: string; name: string; price: number }>}
 */
export function parseAddonLineItemsFromBooking(addonDetails) {
  if (!addonDetails) {
    return [];
  }
  const parsed = typeof addonDetails === 'string' ? safeJsonParse(addonDetails) : addonDetails;
  if (!parsed) {
    return [];
  }
  const sourceItems = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.items)
      ? parsed.items
      : Array.isArray(parsed.addons)
        ? parsed.addons
        : [];

  return sourceItems
    .map((item, idx) => {
      const cents = numberOrZero(item?.priceCents ?? item?.price_cents);
      const label =
        String(item?.name ?? item?.label ?? item?.title ?? '').trim() || `Add-on ${idx + 1}`;
      return {
        id: String(item?.id ?? item?.addon_id ?? `addon-${idx + 1}`),
        name: label,
        price: cents / 100,
      };
    })
    .filter((item) => item.price >= 0);
}
