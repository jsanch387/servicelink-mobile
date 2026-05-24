import { serviceDurationHHmmToMinutes } from '../../../../components/ui/durationTime';
import { twelveHourDisplayToHhMm } from '../../../quotes/utils/validateSendQuotePayload';
import { validateMaintenanceInviteForm } from './validateMaintenanceInviteForm';

const MIN_DURATION_MINUTES = 30;
const DEFAULT_SERVICE_NAME = 'Maintenance';

/**
 * @typedef {object} MaintenanceInviteFormInput
 * @property {string} businessId
 * @property {string} businessSlug
 * @property {string} customerId
 * @property {string} priceUsdText
 * @property {string} durationHhMm
 * @property {string} [preferredDateYyyyMmDd]
 * @property {string} [preferredTime12h]
 * @property {string} [serviceNameSnapshot]
 */

/**
 * @param {MaintenanceInviteFormInput} input
 * @returns {{ ok: true; body: Record<string, unknown> } | { ok: false; message: string }}
 */
export function buildMaintenanceInvitePayload(input) {
  const businessId = String(input.businessId ?? '').trim();
  if (!businessId) {
    return {
      ok: false,
      message: 'Your business profile is missing. Finish setup on the web app first.',
    };
  }

  const businessSlug = String(input.businessSlug ?? '').trim();
  if (!businessSlug) {
    return {
      ok: false,
      message: 'Your public business slug is missing. Add it on the web app, then try again.',
    };
  }

  const customerId = String(input.customerId ?? '').trim();
  if (!customerId) {
    return { ok: false, message: 'Missing customer. Go back and try again.' };
  }

  const validation = validateMaintenanceInviteForm({
    priceUsdText: input.priceUsdText,
    durationHhMm: input.durationHhMm,
  });
  if (!validation.valid) {
    return { ok: false, message: validation.error ?? 'Check the form and try again.' };
  }

  const priceUsd = Number(String(input.priceUsdText ?? '').trim());
  if (!Number.isFinite(priceUsd) || priceUsd < 0) {
    return { ok: false, message: 'Enter a valid price per visit.' };
  }
  const priceCents = Math.round(priceUsd * 100);

  const durationMinutes = serviceDurationHHmmToMinutes(input.durationHhMm);
  if (!Number.isFinite(durationMinutes) || durationMinutes < MIN_DURATION_MINUTES) {
    return { ok: false, message: 'Service duration must be at least 30 minutes.' };
  }

  const anchorDate = String(input.preferredDateYyyyMmDd ?? '').trim();
  const preferredTime12h = String(input.preferredTime12h ?? '').trim();
  const anchorTime = preferredTime12h ? twelveHourDisplayToHhMm(preferredTime12h) : null;

  if (anchorDate && !anchorTime) {
    return { ok: false, message: 'Select a valid time for the suggested visit date.' };
  }
  if (!anchorDate && preferredTime12h) {
    // Server requires anchorTime only when anchorDate is set — omit time when no date.
  }

  /** @type {Record<string, unknown>} */
  const body = {
    businessId,
    businessSlug,
    customerId,
    serviceNameSnapshot:
      String(input.serviceNameSnapshot ?? DEFAULT_SERVICE_NAME).trim() || DEFAULT_SERVICE_NAME,
    priceCents,
    durationMinutes,
  };

  if (anchorDate) {
    body.anchorDate = anchorDate;
    body.anchorTime = anchorTime;
  }

  return { ok: true, body };
}
