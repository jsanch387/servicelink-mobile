import { serviceDurationHHmmToMinutes } from '../../../components/ui/durationTime';
import {
  QUOTE_CUSTOMER_EMAIL_MAX,
  QUOTE_CUSTOMER_NAME_MAX,
  QUOTE_NOTE_MAX,
  QUOTE_SERVICE_NAME_MAX,
  QUOTE_VEHICLE_MAKE_MAX,
  QUOTE_VEHICLE_MODEL_MAX,
  QUOTE_VEHICLE_YEAR_MAX,
} from '../constants/createQuoteFieldLimits';
import { isValidEmailFormat } from '../../../utils/email';
import { canonicalNanpDigits } from '../../../utils/phone';

/**
 * @param {string} display
 * @returns {string | null} `HH:mm` 24h or null if invalid
 */
export function twelveHourDisplayToHhMm(display) {
  const raw = String(display ?? '').trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let h = Number(match[1]);
  const m = match[2];
  if (m !== '00' && m !== '30') return null;
  const ap = match[3].toUpperCase();
  if (!Number.isFinite(h) || h < 1 || h > 12) return null;
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}

/**
 * Maps a DB time (`HH:mm` / `HH:mm:ss`) to create-quote schedule strings (`TimeSelectField`):
 * `twelveHourDisplayToHhMm` only accepts `:00` and `:30`, so minutes are snapped to the nearest half hour.
 *
 * @param {string | null | undefined} timeRaw
 * @returns {string} e.g. `9:00 AM`, or empty when unparseable
 */
export function dbTimeToCreateQuoteTime12hSnapped(timeRaw) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(timeRaw ?? '').trim());
  if (!m) return '';
  let h = Number(m[1]) % 24;
  let min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return '';
  if (min < 15) min = 0;
  else if (min < 45) min = 30;
  else {
    min = 0;
    h = (h + 1) % 24;
  }
  const period = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(min).padStart(2, '0')} ${period}`;
}

function isValidYyyyMmDd(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, mo, d] = s.split('-').map((x) => Number(x));
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

function trimOrNull(s) {
  const t = String(s ?? '').trim();
  return t || null;
}

/**
 * @typedef {object} SendQuoteFormInput
 * @property {string} businessSlug
 * @property {string} customerName
 * @property {string} customerEmail
 * @property {string} customerPhoneDisplay
 * @property {string} vehicleYear
 * @property {string} vehicleMake
 * @property {string} vehicleModel
 * @property {string} serviceName
 * @property {string} priceUsdText
 * @property {string} durationHhMm
 * @property {string} note
 * @property {string} scheduledDateYyyyMmDd
 * @property {string} scheduledStartTime12h
 */

/**
 * @param {SendQuoteFormInput} input
 * @returns {{ ok: true, body: Record<string, unknown> } | { ok: false, message: string }}
 */
export function validateSendQuotePayload(input) {
  const businessSlug = String(input.businessSlug ?? '').trim();
  if (!businessSlug) {
    return {
      ok: false,
      message: 'Your business link is missing a slug. Finish setup on the web app first.',
    };
  }

  const customerName = String(input.customerName ?? '').trim();
  if (!customerName) {
    return { ok: false, message: 'Customer name is required.' };
  }
  if (customerName.length > QUOTE_CUSTOMER_NAME_MAX) {
    return { ok: false, message: 'Customer name is too long.' };
  }

  const customerEmail = String(input.customerEmail ?? '').trim();
  if (!isValidEmailFormat(customerEmail)) {
    return { ok: false, message: 'Enter a valid customer email.' };
  }
  if (customerEmail.length > QUOTE_CUSTOMER_EMAIL_MAX) {
    return { ok: false, message: 'Email is too long.' };
  }

  const phoneDigits = canonicalNanpDigits(input.customerPhoneDisplay);
  /** @type {string | undefined} */
  let customerPhone;
  if (phoneDigits.length > 0) {
    if (phoneDigits.length !== 10) {
      return { ok: false, message: 'Phone must be 10 digits (US), or leave it blank.' };
    }
    customerPhone = phoneDigits;
  }

  const serviceName = String(input.serviceName ?? '').trim();
  if (!serviceName) {
    return { ok: false, message: 'Service name is required.' };
  }
  if (serviceName.length > QUOTE_SERVICE_NAME_MAX) {
    return { ok: false, message: 'Service name is too long.' };
  }

  const priceRaw = String(input.priceUsdText ?? '')
    .replace(/\$/g, '')
    .trim();
  const priceNum = parseFloat(priceRaw);
  if (!Number.isFinite(priceNum) || priceNum < 0) {
    return { ok: false, message: 'Enter a valid price (0 or more).' };
  }
  const priceCents = Math.round(priceNum * 100);
  if (!Number.isFinite(priceCents) || priceCents < 0 || !Number.isInteger(priceCents)) {
    return { ok: false, message: 'Enter a valid price (0 or more).' };
  }

  const durationMinutes = serviceDurationHHmmToMinutes(input.durationHhMm);
  if (
    !Number.isFinite(durationMinutes) ||
    durationMinutes <= 0 ||
    !Number.isInteger(durationMinutes)
  ) {
    return { ok: false, message: 'Choose how long the service takes.' };
  }

  const scheduledDate = String(input.scheduledDateYyyyMmDd ?? '').trim();
  if (!isValidYyyyMmDd(scheduledDate)) {
    return { ok: false, message: 'Scheduled date must be YYYY-MM-DD.' };
  }

  const scheduledStartTime = twelveHourDisplayToHhMm(input.scheduledStartTime12h);
  if (!scheduledStartTime) {
    return { ok: false, message: 'Choose a start time.' };
  }

  const noteRaw = String(input.note ?? '');
  if (noteRaw.length > QUOTE_NOTE_MAX) {
    return { ok: false, message: `Note must be ${QUOTE_NOTE_MAX} characters or less.` };
  }
  const note = trimOrNull(input.note);
  const vehicleYear = trimOrNull(input.vehicleYear);
  if (vehicleYear && vehicleYear.length > QUOTE_VEHICLE_YEAR_MAX) {
    return { ok: false, message: 'Vehicle year is invalid.' };
  }
  const vehicleMake = trimOrNull(input.vehicleMake);
  if (vehicleMake && vehicleMake.length > QUOTE_VEHICLE_MAKE_MAX) {
    return { ok: false, message: 'Vehicle make is too long.' };
  }
  const vehicleModel = trimOrNull(input.vehicleModel);
  if (vehicleModel && vehicleModel.length > QUOTE_VEHICLE_MODEL_MAX) {
    return { ok: false, message: 'Vehicle model is too long.' };
  }

  /** @type {Record<string, unknown>} */
  const body = {
    businessSlug,
    customerName,
    customerEmail,
    serviceName,
    priceCents,
    durationMinutes,
    scheduledDate,
    scheduledStartTime,
  };

  if (customerPhone) {
    body.customerPhone = customerPhone;
  }
  if (vehicleYear) {
    body.vehicleYear = vehicleYear;
  }
  if (vehicleMake) {
    body.vehicleMake = vehicleMake;
  }
  if (vehicleModel) {
    body.vehicleModel = vehicleModel;
  }
  if (note) {
    body.note = note;
  }

  return { ok: true, body };
}
