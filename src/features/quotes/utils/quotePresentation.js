import {
  QUOTE_DETAIL_KIND_REQUEST,
  QUOTE_DETAIL_KIND_SENT,
  QUOTES_FILTER_APPROVED,
  QUOTES_FILTER_REQUEST,
  QUOTES_FILTER_SENT,
} from '../constants';
import { splitBookingServiceName } from '../../../utils/splitBookingServiceName';
import {
  formatScheduledDateUserFacing,
  isValidCalendarYyyyMmDd,
} from './formatScheduledDateDisplay';
import { resolveQuoteRequestBrief } from './resolveQuoteRequestBrief';
import { dbTimeToCreateQuoteTime12hSnapped } from './validateSendQuotePayload';

function startOfLocalDayMs(ms) {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Compact inbox timestamp — `Today · 9:14 AM`, `Yesterday`, or `May 6`.
 *
 * @param {string | null | undefined} iso
 * @param {number} [nowMs]
 */
export function formatQuoteInboxRelative(iso, nowMs = Date.now()) {
  if (!iso) return '';
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return '';

  const todayStart = startOfLocalDayMs(nowMs);
  const dayStart = startOfLocalDayMs(ms);
  const dayDiff = Math.round((todayStart - dayStart) / 86400000);

  const timeStr = new Date(ms).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (dayDiff === 0) return `Today · ${timeStr}`;
  if (dayDiff === 1) return 'Yesterday';
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Day label for a card — `Today`, `Tomorrow`, else a weekday with its date
 * (`Tue, Sep 8`) so the owner never has to work out which day is meant.
 *
 * @param {string | null | undefined} yyyyMmDd
 * @param {number} [nowMs]
 */
export function formatQuoteCardDayLabel(yyyyMmDd, nowMs = Date.now()) {
  const raw = String(yyyyMmDd ?? '').trim();
  if (!isValidCalendarYyyyMmDd(raw)) return '';
  const [year, month, day] = raw.split('-').map(Number);
  const dayStart = new Date(year, month - 1, day).getTime();
  const dayDiff = Math.round((dayStart - startOfLocalDayMs(nowMs)) / 86400000);
  if (dayDiff === 0) return 'Today';
  if (dayDiff === 1) return 'Tomorrow';
  if (dayDiff === -1) return 'Yesterday';
  return new Date(dayStart).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * @param {string | null | undefined} iso
 */
export function formatQuoteDetailTimestamp(iso) {
  if (!iso) return '—';
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return '—';
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Activity timeline stamp — drops the year inside the current year so the rail
 * stays quiet: `Sep 2, 11:09 PM`.
 *
 * @param {string | number | null | undefined} iso
 * @param {number} [nowMs]
 */
export function formatQuoteActivityTimestamp(iso, nowMs = Date.now()) {
  if (iso == null || iso === '') return '';
  const ms = typeof iso === 'number' ? iso : new Date(iso).getTime();
  if (!Number.isFinite(ms)) return '';
  const when = new Date(ms);
  const sameYear = when.getFullYear() === new Date(nowMs).getFullYear();
  return when.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * @param {string | number | null | undefined} iso
 */
export function formatQuoteCalendarDate(iso) {
  if (!iso) return '—';
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return '—';
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * @param {number | string | null | undefined} cents
 */
export function formatQuoteMoney(cents) {
  const value = Number(cents);
  if (!Number.isFinite(value)) return '$0';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 100 === 0 ? 0 : 2,
  }).format(value / 100);
}

/**
 * Owner-facing label for list/detail (`sent` → `Pending` while awaiting customer).
 *
 * @param {string | null | undefined} status
 */
export function formatOwnerFacingQuoteStatus(status) {
  const s = String(status ?? '').toLowerCase();
  switch (s) {
    case 'requested':
      return 'Requested';
    case 'draft':
      return 'Draft';
    case 'sent':
      return 'Pending';
    case 'viewed':
      return 'Viewed';
    case 'approved':
      return 'Approved';
    case 'declined':
      return 'Declined';
    case 'expired':
      return 'Expired';
    case 'cancelled':
      return 'Cancelled';
    default:
      return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
  }
}

/**
 * @param {{ vehicle_year?: string | number | null; vehicle_make?: string | null; vehicle_model?: string | null }} row
 */
function formatVehicleLine(row) {
  const parts = [row?.vehicle_year, row?.vehicle_make, row?.vehicle_model]
    .map((p) => (p == null ? '' : String(p).trim()))
    .filter(Boolean);
  return parts.join(' ');
}

/**
 * Display lines for whatever the quote is about. Prefer `assets` labels;
 * fall back to the car-1 fields older rows still carry.
 *
 * @param {object | null | undefined} row
 * @returns {string[]}
 */
export function quoteAssetLines(row) {
  const assets = Array.isArray(row?.assets) ? row.assets : [];
  if (assets.length > 0) {
    return assets.map((asset) => String(asset?.label ?? '').trim()).filter(Boolean);
  }

  const primary =
    String(row?.vehicleLine ?? '').trim() ||
    formatVehicleLine({
      vehicle_year: quoteField(row, 'vehicle_year', 'vehicleYear'),
      vehicle_make: quoteField(row, 'vehicle_make', 'vehicleMake'),
      vehicle_model: quoteField(row, 'vehicle_model', 'vehicleModel'),
    });
  const { additionalVehicles } = resolveQuoteRequestBrief({
    message: quoteField(row, 'request_message', 'requestMessage'),
    vehicle: primary,
  });
  return [primary, ...additionalVehicles].map((line) => String(line ?? '').trim()).filter(Boolean);
}

function formatCardVehicles(row) {
  const labels = quoteAssetLines(row);
  return {
    label: labels[0] ?? '',
    extra: labels.length > 1 ? `+${labels.length - 1} more` : '',
  };
}

/**
 * Car 1 year / make / model — first vehicle asset, else the legacy columns.
 *
 * @param {object} row
 */
function firstVehicleFields(row) {
  const assets = Array.isArray(row?.assets) ? row.assets : [];
  const firstVehicle =
    assets.find((asset) => String(asset?.type ?? '').toLowerCase() === 'vehicle') ?? assets[0];
  const attributes =
    firstVehicle?.attributes && typeof firstVehicle.attributes === 'object'
      ? firstVehicle.attributes
      : {};
  const year = attributes.year ?? quoteField(row, 'vehicle_year', 'vehicleYear');
  const make = attributes.make ?? quoteField(row, 'vehicle_make', 'vehicleMake');
  const model = attributes.model ?? quoteField(row, 'vehicle_model', 'vehicleModel');
  return {
    year: year != null ? String(year).trim() : '',
    make: make != null ? String(make).trim() : '',
    model: model != null ? String(model).trim() : '',
  };
}

/**
 * Unlabelled timing on a card — `Tomorrow - 2:30 PM`, `Sat, Jul 4 - 9 AM`.
 *
 * @param {object} row
 * @param {number} nowMs
 */
function formatCardWhen(row, nowMs) {
  const day = formatQuoteCardDayLabel(row?.scheduled_date ?? row?.scheduledDate, nowMs);
  if (!day) return '';
  const time =
    dbTimeToCreateQuoteTime12hSnapped(
      String(row?.scheduled_start_time ?? row?.scheduledTime ?? '').trim(),
    ) || '';
  return time ? `${day} - ${time.replace(':00', '')}` : day;
}

/**
 * Card wording stays friendlier than the detail pill: `sent` reads as `Quote sent`.
 *
 * @param {string | null | undefined} status
 */
function formatQuoteCardStatus(status) {
  const s = String(status ?? '').toLowerCase();
  return s === 'sent' ? 'Quote sent' : formatOwnerFacingQuoteStatus(status);
}

function quoteField(row, snakeCaseKey, camelCaseKey) {
  return row?.[camelCaseKey] !== undefined ? row[camelCaseKey] : row?.[snakeCaseKey];
}

function formatQuoteTimeDisplay(value) {
  const raw = String(value ?? '').trim();
  const match = /^(\d{1,2}):(\d{2})/.exec(raw);
  if (!match) return raw;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return raw;
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function normalizeQuoteAddonDetails(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((addon) => {
      const id = String(addon?.id ?? '').trim();
      const name = String(addon?.name ?? '').trim();
      const priceCents = Number(addon?.priceCents ?? addon?.price_cents);
      const durationRaw = addon?.durationMinutes ?? addon?.duration_minutes;
      const durationMinutes = durationRaw == null ? null : Number(durationRaw);
      if (!id || !name || !Number.isFinite(priceCents)) return null;
      return {
        id,
        name,
        priceCents: Math.max(0, Math.round(priceCents)),
        durationMinutes:
          Number.isFinite(durationMinutes) && durationMinutes > 0
            ? Math.round(durationMinutes)
            : null,
      };
    })
    .filter(Boolean);
}

/**
 * @param {{ request_message?: string | null; vehicle_year?: unknown; vehicle_make?: unknown; vehicle_model?: unknown }} row
 * @param {number} [maxChars]
 */
function summarizeInboundQuote(row, maxChars = 120) {
  const msg = String(row.request_message ?? '').trim();
  if (msg) {
    const line = msg.split('\n')[0].trim();
    const cap = Math.max(40, maxChars);
    return line.length > cap ? `${line.slice(0, cap - 1)}…` : line;
  }
  const vehicle = formatVehicleLine(row);
  if (vehicle) return vehicle;
  return 'Quote request';
}

/**
 * @typedef {object} QuoteRow
 * @property {string} id
 * @property {string} business_id
 * @property {string} status
 * @property {string} source
 * @property {string | null} [customer_name]
 * @property {string | null} [customer_email]
 * @property {string | null} [customer_phone]
 * @property {string | number | null} [vehicle_year]
 * @property {string | null} [vehicle_make]
 * @property {string | null} [vehicle_model]
 * @property {string | null} [request_message]
 * @property {string | null} [service_name]
 * @property {number | null} [price_cents]
 * @property {number | null} [duration_minutes]
 * @property {string | null} [scheduled_date]
 * @property {string | null} [scheduled_start_time]
 * @property {string | null} [updated_at]
 * @property {string | null} [created_at]
 */

/**
 * Inbox tabs: inbound vs outbound owner workflows (aligned with `quotes.source` / `quotes.status`).
 *
 * @param {QuoteRow[]} rows
 */
export function partitionQuotesForInbox(rows) {
  /** @type {QuoteRow[]} */
  const requests = [];
  /** @type {QuoteRow[]} */
  const sent = [];
  for (const row of rows) {
    const isInboundRequested =
      String(row.source) === 'customer_requested' && String(row.status) === 'requested';
    if (isInboundRequested) {
      requests.push(row);
    } else {
      sent.push(row);
    }
  }
  return { requests, sent };
}

/**
 * Groups quotes into Request, Sent, and Approved inbox filters.
 *
 * @param {QuoteRow[]} rows
 */
export function groupQuotesByWorkflow(rows) {
  const groups = {
    [QUOTES_FILTER_REQUEST]: [],
    [QUOTES_FILTER_SENT]: [],
    [QUOTES_FILTER_APPROVED]: [],
  };

  for (const row of rows) {
    const status = String(row.status ?? '')
      .trim()
      .toLowerCase();

    if (status === 'sent' || status === 'viewed') {
      groups[QUOTES_FILTER_SENT].push(row);
    } else if (status === 'approved') {
      groups[QUOTES_FILTER_APPROVED].push(row);
    } else if (status !== 'declined' && status !== 'expired' && status !== 'cancelled') {
      groups[QUOTES_FILTER_REQUEST].push(row);
    }
  }

  return groups;
}

/**
 * @param {QuoteRow} row
 * @param {number} nowMs
 */
export function mapQuoteRequestCard(row, nowMs = Date.now()) {
  const name = String(quoteField(row, 'customer_name', 'customerName') ?? '').trim() || 'Customer';
  const service = String(quoteField(row, 'service_name', 'serviceName') ?? '').trim();
  const vehicles = formatCardVehicles(row);
  const message = String(quoteField(row, 'request_message', 'requestMessage') ?? '').trim();
  const brief = resolveQuoteRequestBrief({
    serviceName: service,
    message,
    vehicle: vehicles.label,
  });
  const when = formatCardWhen(row, nowMs) || brief.preferredTiming || '';
  const activityAt =
    quoteField(row, 'updated_at', 'activityAt') ?? quoteField(row, 'created_at', 'createdAt');
  const receivedLabel = formatQuoteInboxRelative(activityAt, nowMs);
  return {
    id: row.id,
    activityAt: activityAt ?? null,
    customerName: name,
    title: brief.headline,
    summary: '',
    vehicleLabel: vehicles.label,
    vehicleExtraLabel: vehicles.extra,
    priceLabel: '',
    timestampLabel: '',
    timingLabel: when,
    receivedLabel,
    statusLabel: 'New request',
    statusRaw: 'requested',
  };
}

/**
 * @param {QuoteRow} row
 * @param {number} [nowMs]
 */
export function mapSentQuoteCard(row, nowMs = Date.now()) {
  const name = String(quoteField(row, 'customer_name', 'customerName') ?? '').trim() || 'Customer';
  const service = String(quoteField(row, 'service_name', 'serviceName') ?? '').trim();
  const serviceName = service ? splitBookingServiceName(service).primary : '';
  const totalCents = quoteField(row, 'price_cents', 'totalCents');
  const hasPrice = totalCents != null && Number.isFinite(Number(totalCents));
  const price = hasPrice ? formatQuoteMoney(totalCents) : '';
  const line = service && hasPrice ? `${service} · ${price}` : service || price || '—';
  const vehicles = formatCardVehicles(row);
  const isApproved = String(row.status ?? '').toLowerCase() === 'approved';
  /** An approved job with no date still needs booking, so say so rather than leaving it blank. */
  const when = formatCardWhen(row, nowMs) || (isApproved ? 'Not set yet' : '');
  const activityAt =
    quoteField(row, 'updated_at', 'activityAt') ?? quoteField(row, 'created_at', 'createdAt');

  return {
    id: row.id,
    activityAt: activityAt ?? null,
    customerName: name,
    title: serviceName || 'Custom quote',
    summary: '',
    serviceLabel: serviceName,
    vehicleLabel: vehicles.label,
    vehicleExtraLabel: vehicles.extra,
    priceLabel: price,
    timestampLabel: '',
    timingLabel: when,
    line,
    statusLabel: formatQuoteCardStatus(row.status),
    statusRaw: String(row.status ?? ''),
  };
}

/**
 * Derives UI kind so stale navigation params still match DB state.
 *
 * @param {QuoteRow | null | undefined} row
 */
export function deriveQuoteDetailKind(row) {
  if (!row) return QUOTE_DETAIL_KIND_SENT;
  const isInboundRequested =
    String(row.source) === 'customer_requested' && String(row.status) === 'requested';
  return isInboundRequested ? QUOTE_DETAIL_KIND_REQUEST : QUOTE_DETAIL_KIND_SENT;
}

/**
 * @param {QuoteRow} row
 * @param {typeof QUOTE_DETAIL_KIND_REQUEST | typeof QUOTE_DETAIL_KIND_SENT} kind
 * @param {{ activeLinkExpiresAt?: string | null }} [opts]
 */
export function mapQuoteDetailModel(row, kind, opts = {}) {
  const activeLinkExpiresAt =
    opts.activeLinkExpiresAt ??
    quoteField(row, 'public_link_expires_at', 'publicLinkExpiresAt') ??
    null;
  const name = String(quoteField(row, 'customer_name', 'customerName') ?? '').trim() || 'Customer';
  const firstVehicle = firstVehicleFields(row);
  const vehicleYear = firstVehicle.year;
  const vehicleMake = firstVehicle.make;
  const vehicleModel = firstVehicle.model;
  const assetLines = quoteAssetLines(row);
  const vehicle = assetLines[0] || '';
  const service = String(quoteField(row, 'service_name', 'serviceName') ?? '').trim();
  const scheduledDate = String(quoteField(row, 'scheduled_date', 'scheduledDate') ?? '').trim();
  const scheduledTime = String(
    quoteField(row, 'scheduled_start_time', 'scheduledTime') ?? '',
  ).trim();

  const base = {
    id: row.id,
    customerName: name,
    email: String(quoteField(row, 'customer_email', 'customerEmail') ?? '').trim(),
    phone: String(quoteField(row, 'customer_phone', 'customerPhone') ?? '').trim(),
  };

  if (kind === QUOTE_DETAIL_KIND_REQUEST) {
    const requestMessage = String(
      quoteField(row, 'request_message', 'requestMessage') ?? '',
    ).trim();
    const scheduledDateYyyyMmDd = isValidCalendarYyyyMmDd(scheduledDate) ? scheduledDate : '';
    const scheduledStartTime12h = dbTimeToCreateQuoteTime12hSnapped(scheduledTime);
    const requestedDateLabel = scheduledDateYyyyMmDd
      ? formatScheduledDateUserFacing(scheduledDateYyyyMmDd)
      : null;
    const requestedTimeLabel = scheduledStartTime12h || null;
    return {
      ...base,
      summary: summarizeInboundQuote(
        {
          request_message: requestMessage,
          vehicle_year: vehicleYear,
          vehicle_make: vehicleMake,
          vehicle_model: vehicleModel,
        },
        220,
      ),
      vehicle,
      vehicles: assetLines,
      assets: Array.isArray(row.assets) ? row.assets : null,
      message: requestMessage,
      receivedAt: formatQuoteDetailTimestamp(
        quoteField(row, 'requested_at', 'requestedAt') ??
          quoteField(row, 'created_at', 'createdAt') ??
          quoteField(row, 'updated_at', 'activityAt'),
      ),
      createdAtIso: quoteField(row, 'created_at', 'createdAt') ?? null,
      serviceName: service,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      scheduledDateYyyyMmDd,
      scheduledStartTime12h,
      requestedDateLabel,
      requestedTimeLabel,
      serviceAddressLine: String(
        quoteField(row, 'service_address_line', 'serviceAddressLine') ?? '',
      ).trim(),
    };
  }

  const totalCents = quoteField(row, 'price_cents', 'totalCents');
  const price = formatQuoteMoney(totalCents);
  const line = service && totalCents != null ? `${service} · ${price}` : service || price || '—';
  const servicePriceOptionId = quoteField(row, 'service_price_option_id', 'servicePriceOptionId');
  const serviceParts = splitBookingServiceName(service);
  const pricingOptionLabel = servicePriceOptionId ? serviceParts.pricingOption : null;
  const serviceTitle = pricingOptionLabel ? serviceParts.primary : service;
  const servicePriceCentsRaw = quoteField(row, 'service_price_cents', 'servicePriceCents');
  const servicePriceCents =
    servicePriceCentsRaw != null && Number.isFinite(Number(servicePriceCentsRaw))
      ? Number(servicePriceCentsRaw)
      : null;
  const addonDetails = normalizeQuoteAddonDetails(quoteField(row, 'addon_details', 'addonDetails'));
  const customerNote = String(
    quoteField(row, 'request_message', 'requestMessage') ??
      row.customerRequestNotes ??
      row.customerNote ??
      '',
  ).trim();
  const businessNote = String(
    quoteField(row, 'note', 'note') ??
      quoteField(row, 'business_note', 'businessNote') ??
      row.ownerNote ??
      '',
  ).trim();

  const st = String(row.status ?? '').toLowerCase();
  let linkHint = 'Customer opens your quote from the link you sent.';
  if (st === 'viewed') linkHint = 'Customer opened the quote link.';
  if (st === 'sent') linkHint = 'Waiting on customer response.';
  if (st === 'approved') linkHint = 'Customer approved this quote.';
  if (st === 'declined') linkHint = 'Customer declined this quote.';
  if (st === 'expired') linkHint = 'This quote link has expired.';
  if (st === 'draft') linkHint = 'Finish details and send a link when ready.';

  const quoteSummaryParts = [];
  if (service) quoteSummaryParts.push(service);
  if (totalCents != null) quoteSummaryParts.push(price);
  const quoteSummary = quoteSummaryParts.length ? quoteSummaryParts.join(' · ') : '—';

  const dm = Number(quoteField(row, 'duration_minutes', 'durationMinutes'));
  let durationLabel = null;
  if (Number.isFinite(dm) && dm > 0) {
    if (dm >= 60) {
      const h = Math.floor(dm / 60);
      const m = dm % 60;
      durationLabel = m > 0 ? `${h} hr ${m} min` : `${h} hr`;
    } else {
      durationLabel = `${dm} min`;
    }
  }

  const createdAtIso = quoteField(row, 'created_at', 'createdAt') ?? null;
  const viewedAtIso = quoteField(row, 'viewed_at', 'viewedAt') ?? null;
  const reminderAtIso =
    quoteField(row, 'customer_reminder_sent_at', 'customerReminderSentAt') ?? null;
  const expiresAtIso = activeLinkExpiresAt ?? null;
  const communications = Array.isArray(row.communications) ? row.communications : [];

  let scheduleLabel = 'Customer will choose date and time';
  let scheduleState = 'customer';
  const scheduleDateLabel = scheduledDate
    ? isValidCalendarYyyyMmDd(scheduledDate)
      ? formatScheduledDateUserFacing(scheduledDate)
      : scheduledDate
    : null;
  const scheduleTimeLabel = scheduledTime ? formatQuoteTimeDisplay(scheduledTime) : null;
  if (scheduledDate && scheduledTime) {
    scheduleLabel = `${scheduleDateLabel} · ${scheduleTimeLabel}`;
    scheduleState = 'scheduled';
  } else if (scheduledDate || scheduledTime) {
    scheduleLabel = 'Schedule incomplete';
    scheduleState = 'incomplete';
  }

  return {
    ...base,
    line,
    serviceTitle: serviceTitle || '',
    pricingOptionLabel,
    servicePriceFormatted: servicePriceCents != null ? formatQuoteMoney(servicePriceCents) : null,
    addonDetails: addonDetails.map((addon) => ({
      ...addon,
      priceFormatted: formatQuoteMoney(addon.priceCents),
    })),
    /** Formatted USD or null when unset. */
    priceFormatted: totalCents != null ? price : null,
    durationLabel,
    statusLabel: formatOwnerFacingQuoteStatus(row.status),
    /** Raw DB enum for pill styling. */
    statusRaw: String(row.status ?? ''),
    vehicleYear,
    vehicleMake,
    vehicleModel,
    vehicles: assetLines,
    assets: Array.isArray(row.assets) ? row.assets : null,
    sentAt: formatQuoteDetailTimestamp(createdAtIso),
    viewedAt: formatQuoteDetailTimestamp(viewedAtIso),
    createdAtIso,
    viewedAtIso,
    reminderAtIso,
    communications,
    expiresAtIso,
    goodUntil: expiresAtIso ? formatQuoteCalendarDate(expiresAtIso) : '—',
    quoteSummary,
    linkHint,
    scheduleLabel,
    scheduleState,
    scheduleDateLabel,
    scheduleTimeLabel,
    customerNote,
    businessNote,
    /** @deprecated Use `businessNote`. */
    note: businessNote,
    serviceAddressLine: String(row.serviceAddressLine ?? '').trim(),
  };
}
