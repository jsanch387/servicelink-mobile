import { isValidEmailFormat } from '../../../utils/email';
import { canonicalNanpDigits } from '../../../utils/phone';
import { twelveHourDisplayToHhMm } from './validateSendQuotePayload';

function isValidYyyyMmDd(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, mo, d] = s.split('-').map((x) => Number(x));
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

/**
 * @param {object} s
 * @param {string} s.customerName
 * @param {string} s.customerEmail
 * @param {string} s.customerPhoneDisplay
 * @param {string} s.serviceName
 * @param {string} s.priceUsdText
 * @param {string} s.durationHhMm
 * @param {string} s.scheduledDateYyyyMmDd
 * @param {string} s.scheduledStartTime12h
 */
export function canAdvanceCreateQuoteStep(step, s) {
  switch (step) {
    case 0: {
      const name = String(s.customerName ?? '').trim();
      const email = String(s.customerEmail ?? '').trim();
      if (!name || !isValidEmailFormat(email)) return false;
      const d = canonicalNanpDigits(s.customerPhoneDisplay);
      if (d.length > 0 && d.length !== 10) return false;
      return true;
    }
    case 1:
      return true;
    case 2: {
      const service = String(s.serviceName ?? '').trim();
      const priceRaw = String(s.priceUsdText ?? '')
        .replace(/\$/g, '')
        .trim();
      const priceNum = parseFloat(priceRaw);
      if (!service || !Number.isFinite(priceNum) || priceNum < 0) return false;
      const duration = String(s.durationHhMm ?? '').trim();
      if (!duration) return false;
      return true;
    }
    case 3: {
      const date = String(s.scheduledDateYyyyMmDd ?? '').trim();
      if (!isValidYyyyMmDd(date)) return false;
      return Boolean(twelveHourDisplayToHhMm(s.scheduledStartTime12h));
    }
    case 4:
      return true;
    default:
      return false;
  }
}
