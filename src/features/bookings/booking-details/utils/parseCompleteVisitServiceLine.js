const OPTION_SEPARATOR = ' — ';

/**
 * @param {Record<string, unknown> | null | undefined} booking
 * @returns {{ label: string; sublabel: string | null }}
 */
export function parseCompleteVisitServiceLine(booking) {
  const rawName = String(booking?.service_name ?? '').trim() || 'Detail package';
  const optionFromColumn = String(
    booking?.service_price_option_label ?? booking?.servicePriceOptionLabel ?? '',
  ).trim();

  if (optionFromColumn && optionFromColumn !== 'Standard') {
    const split = splitCombinedServiceName(rawName);
    return {
      label: split.label,
      sublabel: split.sublabel ?? optionFromColumn,
    };
  }

  return splitCombinedServiceName(rawName);
}

/**
 * @param {string} rawName
 * @returns {{ label: string; sublabel: string | null }}
 */
export function splitCombinedServiceName(rawName) {
  const trimmed = String(rawName ?? '').trim() || 'Detail package';

  const emDashIndex = trimmed.indexOf(OPTION_SEPARATOR);
  if (emDashIndex > 0) {
    const label = trimmed.slice(0, emDashIndex).trim();
    const sublabel = trimmed.slice(emDashIndex + OPTION_SEPARATOR.length).trim();
    if (label && sublabel) {
      return { label, sublabel };
    }
  }

  const parenMatch = trimmed.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    const label = parenMatch[1].trim();
    const sublabel = parenMatch[2].trim();
    if (label && sublabel) {
      return { label, sublabel };
    }
  }

  return { label: trimmed, sublabel: null };
}
