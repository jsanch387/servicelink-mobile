import { parseBookingStartLocalMs } from '../../../home/utils/bookingStart';
import { formatPhoneForDisplay } from '../../../../utils/phone';
import { splitBookingServiceName } from '../../../../utils/splitBookingServiceName';
import { resolveBookingDiscount } from './resolveBookingDiscount';
import { resolveBookingSessionFees } from './resolveBookingSessionFees';
import { resolveSessionPaymentForDisplay } from './resolveSessionPaymentForDisplay';
import { getSessionPaymentMethodLabel, getSessionPaymentRowLabel } from './sessionPaymentDisplay';

function formatMoney(amount) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(safe);
}

/**
 * @param {number} cents
 * @param {string} [currencyLower] lowercase ISO 4217 from `booking_payments.currency`
 */
function formatMoneyFromCents(cents, currencyLower = 'usd') {
  const safe = Math.max(0, Math.round(Number(cents) || 0));
  const code =
    String(currencyLower ?? 'usd')
      .trim()
      .toUpperCase() || 'USD';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 2,
    }).format(safe / 100);
  } catch {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(safe / 100);
  }
}

function clean(value, fallback = 'Not provided') {
  const str = typeof value === 'string' ? value.trim() : '';
  return str || fallback;
}

function formatHourLabel(hours) {
  return hours === 1 ? '1 hr' : `${hours} hrs`;
}

function formatDuration(minutesValue) {
  const minutes = Number(minutesValue);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return 'Duration not set';
  }
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) {
    return `${mins} min`;
  }
  if (mins === 0) {
    return formatHourLabel(hrs);
  }
  return `${formatHourLabel(hrs)} ${mins} min`;
}

function formatMoneyOrFallback(amount, fallback = 'Not set') {
  if (!Number.isFinite(amount)) {
    return fallback;
  }
  return formatMoney(amount);
}

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
 * Accepts camelCase (merged API / client) or snake_case (raw Supabase embed).
 *
 * @param {Record<string, unknown> | null | undefined} raw
 */
function normalizeBookingPaymentSummary(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const p = /** @type {Record<string, unknown>} */ (raw);
  const read = (camel, snake) => p[camel] ?? p[snake];
  const curRaw = read('currency', 'currency');
  const cur = typeof curRaw === 'string' && curRaw.trim() ? curRaw.trim().toLowerCase() : 'usd';
  return {
    paymentStatus: String(read('paymentStatus', 'payment_status') ?? 'not_required'),
    paymentMethodSelected: String(
      read('paymentMethodSelected', 'payment_method_selected') ?? 'none',
    ),
    currency: cur,
    totalAmountCents: Math.max(0, Number(read('totalAmountCents', 'total_amount_cents') ?? 0) || 0),
    paidOnlineAmountCents: Math.max(
      0,
      Number(read('paidOnlineAmountCents', 'paid_online_amount_cents') ?? 0) || 0,
    ),
    remainingAmountCents: Math.max(
      0,
      Number(read('remainingAmountCents', 'remaining_amount_cents') ?? 0) || 0,
    ),
    sessionFeesTotalCents: Math.max(
      0,
      Number(read('sessionFeesTotalCents', 'session_fees_total_cents') ?? 0) || 0,
    ),
    sessionPaymentMethod:
      typeof read('sessionPaymentMethod', 'session_payment_method') === 'string'
        ? read('sessionPaymentMethod', 'session_payment_method')
        : null,
    sessionPaymentAmountCents: Math.max(
      0,
      Number(read('sessionPaymentAmountCents', 'session_payment_amount_cents') ?? 0) || 0,
    ),
    sessionPaymentStripeIntentId:
      typeof read('sessionPaymentStripeIntentId', 'session_payment_stripe_payment_intent_id') ===
      'string'
        ? read('sessionPaymentStripeIntentId', 'session_payment_stripe_payment_intent_id')
        : null,
  };
}

/**
 * @typedef {{
 *   visible: boolean;
 *   variant: 'pay_in_person' | 'deposit' | 'paid_full' | 'session_paid' | null;
 *   status: string;
 *   detail: string | null;
 *   accessibilityLabel: string;
 * }} BookingPaymentModel
 */

function emptyPaymentModel() {
  return {
    visible: false,
    variant: null,
    status: '',
    detail: null,
    accessibilityLabel: '',
  };
}

/**
 * When `booking_payments` still stores pre-discount service+add-on totals,
 * rewrite total/remaining for UI so Pay in person / deposit match the sale.
 *
 * @param {ReturnType<typeof normalizeBookingPaymentSummary>} paymentSummary
 * @param {{
 *   servicePriceCents: number;
 *   addOnsTotalCents: number;
 *   discountCents: number;
 * }} args
 */
export function reconcilePaymentSummaryWithDiscount(
  paymentSummary,
  { servicePriceCents, addOnsTotalCents, discountCents },
) {
  if (!paymentSummary || discountCents <= 0) return paymentSummary;

  const grossCents = Math.max(0, Math.round(servicePriceCents) + Math.round(addOnsTotalCents));
  const netCents = Math.max(0, grossCents - Math.max(0, Math.round(discountCents)));
  const total = Math.max(0, Math.round(paymentSummary.totalAmountCents));
  const rem = Math.max(0, Math.round(paymentSummary.remainingAmountCents));
  const paid = Math.max(0, Math.round(paymentSummary.paidOnlineAmountCents));
  const sessionFees = Math.max(0, Math.round(paymentSummary.sessionFeesTotalCents));

  // Payment row matches pre-discount gross (common after sale snapshot lands on booking only).
  if (total !== grossCents || sessionFees > 0) {
    return paymentSummary;
  }

  const nextTotal = netCents;
  const nextRem =
    rem === total || rem === grossCents
      ? Math.max(0, nextTotal - paid)
      : Math.max(0, rem - discountCents);

  return {
    ...paymentSummary,
    totalAmountCents: nextTotal,
    remainingAmountCents: nextRem,
  };
}

/**
 * Booking details Payment block — variant logic aligned with web `AvailabilityBookingDetailPanel`.
 * Omits the section when there is no merged `booking_payments` row, or when there is no
 * actionable payment state (e.g. `pay_now` with zero online paid and no in-person framing).
 *
 * @param {Record<string, unknown> | null | undefined} paymentRaw
 * @param {string | null | undefined} [bookingStatus]
 * @returns {BookingPaymentModel}
 */
export function buildBookingPaymentSection(paymentRaw, bookingStatus, jobStatus) {
  const payment = normalizeBookingPaymentSummary(paymentRaw);
  if (!payment) {
    return emptyPaymentModel();
  }

  const rem = Math.max(0, Math.round(payment.remainingAmountCents));
  const method = String(payment.paymentMethodSelected ?? '')
    .trim()
    .toLowerCase();
  const total = Math.max(0, Math.round(payment.totalAmountCents));
  const paymentStatus = String(payment.paymentStatus ?? '')
    .trim()
    .toLowerCase();
  const fmt = (cents) => formatMoneyFromCents(cents, payment.currency);
  const resolved = resolveSessionPaymentForDisplay(payment, bookingStatus, jobStatus);
  const paid = Math.max(0, Math.round(resolved.paidOnlineCents));
  const sessionMethod = resolved.sessionMethod;
  const sessionPaid = Math.max(0, Math.round(resolved.sessionPaidCents));

  if (sessionMethod && sessionPaid > 0) {
    const status = getSessionPaymentMethodLabel(sessionMethod);
    const detail =
      paid > 0
        ? `${fmt(paid)} paid online · ${fmt(sessionPaid)} via ${status.toLowerCase()}`
        : fmt(sessionPaid);
    const accessibilityLabel =
      paid > 0
        ? `${status}. ${fmt(paid)} paid online and ${fmt(sessionPaid)} collected via ${status.toLowerCase()}.`
        : `${status}. ${fmt(sessionPaid)} collected.`;
    return {
      visible: true,
      variant: 'session_paid',
      status,
      detail,
      accessibilityLabel,
    };
  }

  if (paymentStatus === 'paid' || paymentStatus === 'paid_full') {
    if (rem <= 0 && paid > 0 && total > 0 && !sessionMethod) {
      return {
        visible: true,
        variant: 'paid_full',
        status: 'Paid online',
        detail: fmt(paid),
        accessibilityLabel: `Paid online. ${fmt(paid)}.`,
      };
    }
  }

  /**
   * In-person / no app checkout: explicit `pay_in_person`, or `none` from owner manual + web no-checkout
   * (`POST /api/public/bookings` with `paymentMethodSelected: "none"` → `booking_payments.payment_method_selected`).
   * Do not fold `pay_now` in here — zero online paid on pay_now has no clear UI state; hide the block.
   */
  const isCollectAtServiceNoOnlinePaid =
    paid <= 0 && (method === 'pay_in_person' || method === 'none' || method === '');

  /** @type {'pay_in_person' | 'deposit' | 'paid_full' | 'other'} */
  let variant;
  if (isCollectAtServiceNoOnlinePaid) {
    variant = 'pay_in_person';
  } else if (paid > 0 && rem > 0) {
    variant = 'deposit';
  } else if (paid > 0 && rem <= 0) {
    variant = 'paid_full';
  } else {
    variant = 'other';
  }

  if (variant === 'other') {
    if (paymentStatus === 'paid' && rem <= 0 && total <= 0) {
      return {
        visible: true,
        variant: 'paid_full',
        status: 'Paid',
        detail: 'No charge',
        accessibilityLabel: 'Paid. No charge for this visit.',
      };
    }
    return emptyPaymentModel();
  }

  if (variant === 'pay_in_person') {
    const detail = total > 0 ? `${fmt(rem)} due` : 'No charge';
    const accessibilityLabel =
      total > 0
        ? `Pay in person. Amount due ${fmt(rem)}.`
        : 'Pay in person. No charge for this visit.';
    return {
      visible: true,
      variant,
      status: 'Pay in person',
      detail,
      accessibilityLabel,
    };
  }

  if (variant === 'deposit') {
    const dueDetail = `${fmt(rem)} due`;
    const detail = method === 'pay_in_person' ? `Pay in person · ${dueDetail}` : dueDetail;
    const accessibilityLabel =
      method === 'pay_in_person'
        ? `Deposit paid. Pay in person. ${fmt(rem)} still due.`
        : `Deposit paid. ${fmt(rem)} still due.`;
    return {
      visible: true,
      variant,
      status: 'Deposit paid',
      detail,
      accessibilityLabel,
    };
  }

  if (variant === 'paid_full') {
    const detail = fmt(paid);
    const accessibilityLabel = `Paid online. ${fmt(paid)}.`;
    return {
      visible: true,
      variant,
      status: 'Paid online',
      detail,
      accessibilityLabel,
    };
  }

  return emptyPaymentModel();
}

/**
 * Vehicle line for detail UI — mirrors list card logic so we do not drop legacy fields.
 * @param {Record<string, unknown> | null | undefined} booking
 */
function buildVehicleDisplayLine(booking) {
  const parts = [
    booking?.customer_vehicle_year,
    clean(booking?.customer_vehicle_make, '').trim(),
    clean(booking?.customer_vehicle_model, '').trim(),
    booking?.vehicle_year,
    clean(booking?.vehicle_make, '').trim(),
    clean(booking?.vehicle_model, '').trim(),
    clean(booking?.vehicle_color, '').trim(),
  ].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(' ').trim();
  }
  const single =
    (typeof booking?.vehicle === 'string' && booking.vehicle.trim()) ||
    (typeof booking?.vehicle_name === 'string' && booking.vehicle_name.trim()) ||
    (typeof booking?.car === 'string' && booking.car.trim()) ||
    (typeof booking?.car_name === 'string' && booking.car_name.trim()) ||
    '';
  return single.trim();
}

function normalizeAddonItems(addonDetails) {
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
        clean(item?.name, '') ||
        clean(item?.label, '') ||
        clean(item?.title, '') ||
        `Add-on ${idx + 1}`;
      return {
        id: String(item?.id ?? item?.addon_id ?? `addon-${idx + 1}`),
        name: label,
        price: cents / 100,
      };
    })
    .filter((item) => item.price >= 0);
}

function buildDateLine(ms) {
  if (!Number.isFinite(ms)) {
    return 'Date not set';
  }
  return new Date(ms).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildTimeLine(ms) {
  if (!Number.isFinite(ms)) {
    return 'Time not set';
  }
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function buildBookingDetailsModel(booking) {
  const ms = parseBookingStartLocalMs(booking?.scheduled_date, booking?.start_time);
  const serviceNameRaw = clean(booking?.service_name, 'Detail package');
  const { primary: serviceName, pricingOption: servicePricingOption } =
    splitBookingServiceName(serviceNameRaw);
  const addOns = normalizeAddonItems(booking?.addon_details);
  const addOnsTotal = addOns.reduce((sum, item) => sum + item.price, 0);
  const servicePrice = Number.isFinite(Number(booking?.service_price_cents))
    ? Number(booking.service_price_cents) / 100
    : null;
  const discount = resolveBookingDiscount(booking);
  const discountDollars = discount?.discountDollars ?? 0;
  const paymentSummary = reconcilePaymentSummaryWithDiscount(
    normalizeBookingPaymentSummary(booking?.payment),
    {
      servicePriceCents: Number.isFinite(servicePrice) ? Math.round(servicePrice * 100) : 0,
      addOnsTotalCents: Math.round(Math.max(0, addOnsTotal) * 100),
      discountCents: discount?.discountCents ?? 0,
    },
  );
  const statusLower = clean(booking?.status, 'confirmed').toLowerCase();
  const isCompleted = statusLower === 'completed' || statusLower === 'complete';
  const resolvedSessionPayment = resolveSessionPaymentForDisplay(
    paymentSummary,
    booking?.status,
    booking?.job_status,
  );
  const sessionFees = resolveBookingSessionFees({
    sessionFeeLines: booking?.session_fee_lines ?? booking?.sessionFeeLines,
    invoiceSnapshot: booking?.invoice_snapshot ?? booking?.invoiceSnapshot,
    paymentSummary,
    servicePrice,
    addOnsTotal,
    discountDollars,
    sessionPaymentAmountCents: resolvedSessionPayment.sessionPaidCents,
    paidOnlineCents: resolvedSessionPayment.paidOnlineCents,
  });
  const sessionFeesTotal = sessionFees.reduce((sum, item) => sum + item.price, 0);
  const computedTotal = Number.isFinite(servicePrice)
    ? Math.max(0, servicePrice + addOnsTotal - discountDollars) + sessionFeesTotal
    : null;
  const paymentTotal =
    paymentSummary?.totalAmountCents > 0 ? paymentSummary.totalAmountCents / 100 : null;
  const total =
    Number.isFinite(computedTotal) &&
    (sessionFeesTotal > 0 || discountDollars > 0) &&
    (!Number.isFinite(paymentTotal) ||
      paymentTotal < computedTotal - 0.001 ||
      (discountDollars > 0 && Math.abs(paymentTotal - computedTotal) > 0.001))
      ? computedTotal
      : Number.isFinite(paymentTotal)
        ? paymentTotal
        : computedTotal;

  const paidOnline = resolvedSessionPayment.paidOnlineCents / 100;
  const sessionPaid = resolvedSessionPayment.sessionPaidCents / 100;
  const paidOnlineCents = Math.max(0, Math.round(resolvedSessionPayment.paidOnlineCents));
  const remainingCents = Math.max(0, Math.round(paymentSummary?.remainingAmountCents ?? 0));
  const totalCents = Math.max(0, Math.round(paymentSummary?.totalAmountCents ?? 0));
  const isDepositPayment =
    paidOnlineCents > 0 && (remainingCents > 0 || (totalCents > 0 && paidOnlineCents < totalCents));
  const paymentAdjustments = [];
  if (paidOnline > 0 && (isCompleted || remainingCents > 0)) {
    paymentAdjustments.push({
      id: 'paid-online',
      label: isDepositPayment ? 'Deposit' : 'Paid online',
      value: `−${formatMoney(paidOnline)}`,
    });
  }
  if (isCompleted && sessionPaid > 0 && resolvedSessionPayment.sessionMethod) {
    paymentAdjustments.push({
      id: 'session-payment',
      label: getSessionPaymentRowLabel(resolvedSessionPayment.sessionMethod),
      value: `−${formatMoney(sessionPaid)}`,
    });
  }

  const vehicleLine = buildVehicleDisplayLine(booking);
  const hasVehicle = vehicleLine.length > 0;

  const addressParts = [
    clean(booking?.customer_street_address, ''),
    clean(booking?.customer_unit_apt, ''),
    clean(booking?.customer_city, ''),
    clean(booking?.customer_state, ''),
    clean(booking?.customer_zip, ''),
  ].filter(Boolean);
  const addressLine = addressParts.join(', ');
  const hasAddress = Boolean(addressLine);

  const customerPhoneDisplay = String(formatPhoneForDisplay(booking?.customer_phone) ?? '').trim();
  const customerEmailRaw = booking?.customer_email;
  const customerEmailDisplay = typeof customerEmailRaw === 'string' ? customerEmailRaw.trim() : '';
  const notesRaw = typeof booking?.customer_notes === 'string' ? booking.customer_notes.trim() : '';

  return {
    bookingId: booking?.id || '',
    status: clean(booking?.status, 'confirmed'),
    schedule: {
      serviceName,
      pricingOption: servicePricingOption,
      date: buildDateLine(ms),
      time: buildTimeLine(ms),
      duration: formatDuration(booking?.duration_minutes),
    },
    price: {
      servicePrice,
      addOns,
      sessionFees,
      total,
    },
    customer: {
      name: clean(booking?.customer_name, 'Walk-in customer'),
      phone: customerPhoneDisplay,
      email: customerEmailDisplay,
    },
    location: {
      address: addressLine,
      hasAddress,
    },
    vehicle: vehicleLine,
    hasVehicle,
    notes: notesRaw,
    formattedPrice: {
      servicePrice: formatMoneyOrFallback(servicePrice),
      addOnsTotal: formatMoney(addOnsTotal),
      hasAddOns: addOns.length > 0,
      hasDiscount: discountDollars > 0,
      discount: discount
        ? {
            label: discount.label,
            value: `−${formatMoney(discountDollars)}`,
          }
        : null,
      sessionFeesTotal: formatMoney(sessionFeesTotal),
      hasSessionFees: sessionFees.length > 0,
      total: formatMoneyOrFallback(total),
      addOns: addOns.map((item) => ({ ...item, priceLabel: formatMoney(item.price) })),
      sessionFees: sessionFees.map((item) => ({ ...item, priceLabel: formatMoney(item.price) })),
      hasPaymentAdjustments: paymentAdjustments.length > 0,
      paymentAdjustments,
    },
    payment: buildBookingPaymentSection(paymentSummary, booking?.status, booking?.job_status),
  };
}
