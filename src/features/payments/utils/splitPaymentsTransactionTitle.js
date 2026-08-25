/** “Mixed jobs”, “Double-jobs”, “Mixed job jobs”. */
const GENERIC_JOBS = /\b(mixed|double)[\s\u00a0\u2010-\u2015-]+jobs?(\s+jobs?)*\b/i;

function extraLabelFromCount(count) {
  const n = Math.max(0, Math.round(Number(count) || 0));
  return n > 0 ? `+${n} more` : '';
}

function normalizeTitle(value) {
  return String(value ?? '')
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function stripGenericMultiJobLabel(value) {
  const stripped = normalizeTitle(value)
    .replace(new RegExp(GENERIC_JOBS.source, 'gi'), ' ')
    .replace(/^[\s—–-]+|[\s—–-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!stripped || /^(mixed|double|jobs?)$/i.test(stripped)) {
    return '';
  }
  return stripped;
}

export function isGenericMultiJobTitle(value) {
  const raw = normalizeTitle(value);
  if (!raw) return false;
  if (/^(mixed|double|jobs?)$/i.test(raw)) return true;
  return GENERIC_JOBS.test(raw) && !stripGenericMultiJobLabel(raw);
}

function cleanServiceName(value) {
  const raw = stripGenericMultiJobLabel(value);
  if (!raw) return '';
  const parts = raw
    .split(/\s+[—–-]\s+/u)
    .map((part) => stripGenericMultiJobLabel(part))
    .filter(Boolean);
  const primary = parts[0] || '';
  if (!primary || isGenericMultiJobTitle(primary) || /^jobs?$/i.test(primary)) {
    return '';
  }
  return primary;
}

/**
 * @param {string | null | undefined} title
 * @param {number} [extraCount]
 * @returns {{ primary: string; extraLabel: string }}
 */
export function splitPaymentsTransactionTitle(title, extraCount = 0) {
  const raw = normalizeTitle(title);
  const moreMatch = raw.match(/^(.*?)\s+\+(\d+)\s+more\s*$/i);
  const withoutMore = moreMatch ? moreMatch[1].trim() : raw;
  const fromTitle = moreMatch ? Number(moreMatch[2]) : 0;
  const primary = cleanServiceName(withoutMore);
  const fullyGeneric = !primary && isGenericMultiJobTitle(withoutMore);
  const looksDouble = /\bdouble[\s\u00a0\u2010-\u2015-]*jobs?\b/i.test(raw);
  const looksMixed = /\bmixed[\s\u00a0\u2010-\u2015-]*jobs?\b/i.test(raw);

  let extraLabel = extraLabelFromCount(fromTitle || extraCount);
  if (!extraLabel && looksDouble) {
    extraLabel = '+1 more';
  }
  if (!extraLabel && fullyGeneric && looksMixed) {
    extraLabel = '+2 more';
  }

  return { primary, extraLabel };
}
