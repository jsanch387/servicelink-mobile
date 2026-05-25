import { MAINTENANCE_PRICE_INPUT_MAX } from '../constants';

export function normalizeMaintenancePriceInput(rawText) {
  const input = String(rawText ?? '').replace(/\$/g, '');
  let out = '';
  let dotSeen = false;
  for (const ch of input) {
    if (ch >= '0' && ch <= '9') {
      out += ch;
      continue;
    }
    if (ch === '.' && !dotSeen) {
      out += ch;
      dotSeen = true;
    }
  }
  return out.slice(0, MAINTENANCE_PRICE_INPUT_MAX);
}

export function parseYyyyMmDdToLocalDate(yyyyMmDd) {
  const s = String(yyyyMmDd ?? '').trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  return Number.isNaN(dt.getTime()) ? new Date() : dt;
}

export function formatLocalDateToYyyyMmDd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  const y = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${month}-${day}`;
}

export function normalizePickerDate(raw) {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw;
  }
  if (raw == null) {
    return null;
  }
  if (typeof raw === 'number') {
    const byNumber = new Date(raw);
    if (!Number.isNaN(byNumber.getTime())) return byNumber;
  }
  if (typeof raw === 'string') {
    const byString = new Date(raw);
    if (!Number.isNaN(byString.getTime())) return byString;
  }
  if (raw && typeof raw === 'object') {
    const ts = raw.timestamp ?? raw?.nativeEvent?.timestamp ?? raw?.value ?? raw?.date ?? null;
    if (typeof ts === 'number' || typeof ts === 'string') {
      const byTs = new Date(ts);
      if (!Number.isNaN(byTs.getTime())) return byTs;
    }
  }
  return null;
}
