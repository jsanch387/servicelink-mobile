import { KNOWN_MINIMAL_INBOX_HEADLINES } from './notificationMinimalTitle';

const MAX_SUB_CHARS = 52;

function normalizeOneLine(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value, max) {
  const t = normalizeOneLine(value);
  if (!t) {
    return '';
  }
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, max - 1)}…`;
}

/**
 * @param {Record<string, unknown> | null | undefined} obj
 * @param {string[]} keys
 */
function pickStringField(obj, keys) {
  if (!obj || typeof obj !== 'object') {
    return '';
  }
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'string') {
      const s = normalizeOneLine(v);
      if (s) {
        return s;
      }
    }
  }
  return '';
}

function customerFromMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return '';
  }
  const nested = metadata.customer;
  if (nested && typeof nested === 'object') {
    const fromNested = pickStringField(nested, [
      'displayName',
      'name',
      'fullName',
      'firstName',
      'first_name',
    ]);
    if (fromNested) {
      return fromNested;
    }
  }
  return pickStringField(metadata, [
    'customerName',
    'customer_name',
    'fromName',
    'from',
    'contactName',
    'contact_name',
    'payerName',
    'payer_name',
  ]);
}

function fromLegacyTitle(rawTitle, displayTitle) {
  if (!KNOWN_MINIMAL_INBOX_HEADLINES.has(displayTitle)) {
    return '';
  }
  const raw = normalizeOneLine(rawTitle);
  if (!raw) {
    return '';
  }
  const patterns = [/\bfrom\s+(.+)$/i, /\brequest\s+from\s+(.+)$/i];
  for (const re of patterns) {
    const m = re.exec(raw);
    if (m?.[1]) {
      const fragment = normalizeOneLine(m[1]);
      if (fragment.length >= 1 && fragment.length < 96) {
        return `From ${truncate(fragment, 44)}`;
      }
    }
  }
  return '';
}

function shortBodyLine(body) {
  const b = normalizeOneLine(body);
  if (!b || b.length > 56) {
    return '';
  }
  if (/https?:\/\//i.test(b) || b.includes('|') || b.includes('\n')) {
    return '';
  }
  return truncate(b, MAX_SUB_CHARS);
}

/**
 * Second line under the minimal headline: "From …" or explicit metadata subtitle.
 *
 * @param {Record<string, unknown> | null | undefined} metadata
 * @param {string | undefined} rawTitle
 * @param {string} displayTitle
 * @param {string | null | undefined} body
 * @returns {string | null}
 */
export function notificationSubtitle(metadata, rawTitle, displayTitle, body) {
  const direct =
    metadata && typeof metadata === 'object'
      ? pickStringField(metadata, [
          'inboxSubtitle',
          'subtitle',
          'secondaryLine',
          'fromLine',
          'previewLine',
        ])
      : '';
  if (direct) {
    let line = truncate(direct, MAX_SUB_CHARS + 8);
    if (!/^from\s/i.test(line)) {
      line = `From ${truncate(direct, 40)}`;
    }
    return line === displayTitle ? null : line;
  }

  const who = customerFromMetadata(metadata);
  if (who) {
    const line = `From ${truncate(who, 44)}`;
    return line === displayTitle ? null : line;
  }

  const legacy = fromLegacyTitle(rawTitle, displayTitle);
  if (legacy) {
    return legacy;
  }

  const fromBody = shortBodyLine(body);
  if (fromBody && fromBody !== displayTitle) {
    return fromBody;
  }

  return null;
}
