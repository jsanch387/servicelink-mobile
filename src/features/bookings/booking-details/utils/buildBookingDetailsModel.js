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

  const vehicleLine = [
    booking?.customer_vehicle_year,
    clean(booking?.customer_vehicle_make, '').trim(),
    clean(booking?.customer_vehicle_model, '').trim(),
  ]
    .filter(Boolean)
    .join(' ');

  const addressParts = [
    clean(booking?.customer_street_address, ''),
    clean(booking?.customer_unit_apt, ''),
    clean(booking?.customer_city, ''),
    clean(booking?.customer_state, ''),
    clean(booking?.customer_zip, ''),
  ].filter(Boolean);
  const addressLine = addressParts.join(', ');
  const hasAddress = Boolean(addressLine);

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
      phone: clean(formatPhoneForDisplay(booking?.customer_phone)),
      email: clean(booking?.customer_email),
    },
    location: {
      address: addressLine || 'Address not provided',
      hasAddress,
    },
    vehicle: vehicleLine || 'Vehicle details not provided',
    notes: 'Not provided',
    formattedPrice: {
      servicePrice: formatMoneyOrFallback(servicePrice),
      addOnsTotal: formatMoney(addOnsTotal),
      hasAddOns: addOns.length > 0,
      total: formatMoneyOrFallback(total),
      addOns: addOns.map((item) => ({ ...item, priceLabel: formatMoney(item.price) })),
    },
  };
}
