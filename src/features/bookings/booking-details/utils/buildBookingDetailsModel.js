import { parseBookingStartLocalMs } from '../../../home/utils/bookingStart';
import { formatPhoneForDisplay } from '../../../../utils/phone';

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
    return `${hrs} hr`;
  }
  return `${hrs} hr ${mins} min`;
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
  };
}

/**
 * @typedef {'neutral' | 'success' | 'accent' | 'muted'} BookingPaymentBannerTone
 */

/**
 * @typedef {{
 *   icon: import('@expo/vector-icons').IconProps['name'];
 *   title: string;
 *   subtitle?: string | null;
 *   tone: BookingPaymentBannerTone;
 * }} BookingPaymentBanner
 */

/**
 * @typedef {{
 *   key: string;
 *   label: string;
 *   value: string;
 *   emphasize?: boolean;
 * }} BookingPaymentLine
 */

/**
 * @typedef {{
 *   visible: boolean;
 *   variant: 'pay_in_person' | 'deposit' | 'paid_full' | 'other' | null;
 *   banner: BookingPaymentBanner | null;
 *   lines: BookingPaymentLine[];
 * }} BookingPaymentModel
 */

/**
 * Booking details Payment block — variant logic aligned with web `AvailabilityBookingDetailPanel`.
 * Show section only when `payment` is present (merged `booking_payments` row).
 *
 * @param {Record<string, unknown> | null | undefined} paymentRaw
 * @returns {BookingPaymentModel}
 */
export function buildBookingPaymentSection(paymentRaw) {
  const payment = normalizeBookingPaymentSummary(paymentRaw);
  if (!payment) {
    return { visible: false, variant: null, banner: null, lines: [] };
  }

  const paid = Math.max(0, Math.round(payment.paidOnlineAmountCents));
  const rem = Math.max(0, Math.round(payment.remainingAmountCents));
  const method = String(payment.paymentMethodSelected ?? '')
    .trim()
    .toLowerCase();
  const total = Math.max(0, Math.round(payment.totalAmountCents));
  const fmt = (cents) => formatMoneyFromCents(cents, payment.currency);

  /**
   * In-person / no app checkout: explicit `pay_in_person`, or `none` from owner manual + web no-checkout
   * (`POST /api/public/bookings` with `paymentMethodSelected: "none"` → `booking_payments.payment_method_selected`).
   * Do not fold `pay_now` in here — zero online paid on pay_now stays the generic “other” copy.
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

  if (variant === 'pay_in_person') {
    const lines =
      total > 0
        ? [{ key: 'due', label: 'Amount due', value: fmt(rem), emphasize: true }]
        : [{ key: 'none', label: 'Balance', value: 'No charge for this visit', emphasize: false }];
    return {
      visible: true,
      variant,
      banner: {
        icon: 'cash-outline',
        title: 'Pay in person',
        subtitle: 'Collect payment from the customer when you complete this appointment.',
        tone: 'neutral',
      },
      lines,
    };
  }

  if (variant === 'deposit') {
    return {
      visible: true,
      variant,
      banner: {
        icon: 'card-outline',
        title: 'Deposit received',
        subtitle: 'Part of the total was paid online. The rest is still owed.',
        tone: 'accent',
      },
      lines: [
        { key: 'paid', label: 'Paid online', value: fmt(paid), emphasize: false },
        { key: 'due', label: 'Still due', value: fmt(rem), emphasize: true },
      ],
    };
  }

  if (variant === 'paid_full') {
    return {
      visible: true,
      variant,
      banner: {
        icon: 'checkmark-circle-outline',
        title: 'Paid in full',
        subtitle: 'Card payment was completed through the app.',
        tone: 'success',
      },
      lines: [{ key: 'paid', label: 'Total paid', value: fmt(paid), emphasize: true }],
    };
  }

  return {
    visible: true,
    variant,
    banner: {
      icon: 'phone-portrait-outline',
      title: 'No app card charge',
      subtitle: 'No card payment was completed through the app for this booking.',
      tone: 'muted',
    },
    lines: [],
  };
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
  const serviceName = clean(booking?.service_name, 'Detail package');
  const addOns = normalizeAddonItems(booking?.addon_details);
  const servicePrice = Number.isFinite(Number(booking?.service_price_cents))
    ? Number(booking.service_price_cents) / 100
    : null;
  const addOnsTotal = addOns.reduce((sum, item) => sum + item.price, 0);
  const total = Number.isFinite(servicePrice) ? servicePrice + addOnsTotal : null;

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
      date: buildDateLine(ms),
      time: buildTimeLine(ms),
      duration: formatDuration(booking?.duration_minutes),
    },
    price: {
      servicePrice,
      addOns,
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
      total: formatMoneyOrFallback(total),
      addOns: addOns.map((item) => ({ ...item, priceLabel: formatMoney(item.price) })),
    },
    payment: buildBookingPaymentSection(booking?.payment),
  };
}
