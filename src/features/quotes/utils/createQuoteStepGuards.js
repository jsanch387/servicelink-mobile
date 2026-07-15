import { isValidEmailFormat } from '../../../utils/email';
import { canonicalNanpDigits } from '../../../utils/phone';
import { CREATE_QUOTE_CUSTOM_JOB_ID, CREATE_QUOTE_STEP } from '../constants/createQuoteWizard';
import { twelveHourDisplayToHhMm } from './validateSendQuotePayload';

function isValidYyyyMmDd(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, mo, d] = s.split('-').map((x) => Number(x));
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

function hasValidServicePriceDuration(s) {
  const service = String(s.serviceName ?? '').trim();
  const priceRaw = String(s.priceUsdText ?? '')
    .replace(/\$/g, '')
    .trim();
  const priceNum = parseFloat(priceRaw);
  if (!service || !Number.isFinite(priceNum) || priceNum < 0) return false;
  const duration = String(s.durationHhMm ?? '').trim();
  return Boolean(duration);
}

/**
 * @param {number} step Logical step (`CREATE_QUOTE_STEP`).
 * @param {object} s
 */
export function canAdvanceCreateQuoteStep(step, s) {
  switch (step) {
    case CREATE_QUOTE_STEP.CUSTOMER: {
      const name = String(s.customerName ?? '').trim();
      const email = String(s.customerEmail ?? '').trim();
      if (!name || !isValidEmailFormat(email)) return false;
      const d = canonicalNanpDigits(s.customerPhoneDisplay);
      if (d.length > 0 && d.length !== 10) return false;
      return true;
    }
    case CREATE_QUOTE_STEP.VEHICLE:
      return true;
    case CREATE_QUOTE_STEP.SERVICE: {
      const id = String(s.selectedServiceId ?? '').trim();
      return Boolean(id);
    }
    case CREATE_QUOTE_STEP.DETAILS: {
      if (s.isCustomJob || String(s.selectedServiceId) === CREATE_QUOTE_CUSTOM_JOB_ID) {
        return hasValidServicePriceDuration(s);
      }
      if (s.priceOptionsLoading) return false;
      const optionsCount = Number(s.pricingOptionsCount) || 0;
      if (optionsCount > 0) {
        return Boolean(String(s.selectedPricingId ?? '').trim());
      }
      return hasValidServicePriceDuration(s);
    }
    case CREATE_QUOTE_STEP.ADDONS:
      return true;
    case CREATE_QUOTE_STEP.SCHEDULE:
      return false;
    case CREATE_QUOTE_STEP.SCHEDULE_PICK: {
      const date = String(s.scheduledDateYyyyMmDd ?? '').trim();
      if (!isValidYyyyMmDd(date)) return false;
      return Boolean(twelveHourDisplayToHhMm(s.scheduledStartTime12h));
    }
    case CREATE_QUOTE_STEP.REVIEW:
      return true;
    default:
      return false;
  }
}
