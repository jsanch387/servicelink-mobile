/**
 * @param {string} message
 * @param {string} summary
 * @param {string} vehicle
 */
export function pickRequestDetailsBody(message, summary, vehicle) {
  const m = String(message ?? '').trim();
  const s = String(summary ?? '').trim();
  const v = String(vehicle ?? '').trim();
  if (m) return m;
  if (s && s !== v && s.toLowerCase() !== 'quote request') return s;
  return '';
}

function normalizeCompare(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function serviceLooksLikeFreeText(service) {
  const words = service.split(/\s+/).filter(Boolean);
  return words.length >= 5 || service.length > 40;
}

/**
 * The public request form appends extra vehicles as their own labelled line
 * (`Second vehicle: 2012 BMW 335i`), so they belong in the Vehicle section
 * rather than buried in the customer’s message.
 */
const EXTRA_VEHICLE_LINE =
  /^(?:second|third|fourth|fifth|additional|other)\s+vehicle(?:\s*#?\d+)?:\s*(.+)$/i;

/**
 * Turns inbound request fields into a non-duplicated brief.
 * Booking-link requests often copy the customer’s ask into `serviceName`
 * and prefix timing onto `message`.
 *
 * @param {{
 *   serviceName?: string;
 *   message?: string;
 *   summary?: string;
 *   vehicle?: string;
 * }} input
 * @returns {{
 *   headline: string;
 *   body: string;
 *   preferredTiming: string;
 *   additionalVehicles: string[];
 * }}
 */
export function resolveQuoteRequestBrief({ serviceName, message, summary, vehicle }) {
  const service = String(serviceName ?? '').trim();
  const rawBody = pickRequestDetailsBody(message, summary, vehicle);
  const lines = rawBody
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let preferredTiming = '';
  /** @type {string[]} */
  const additionalVehicles = [];
  const primaryVehicleKey = normalizeCompare(vehicle);
  const leftover = [];
  for (const line of lines) {
    const timing = /^preferred timing:\s*(.+)$/i.exec(line);
    if (timing && !preferredTiming) {
      preferredTiming = timing[1].trim();
      continue;
    }
    const extraVehicle = EXTRA_VEHICLE_LINE.exec(line);
    if (extraVehicle) {
      const value = extraVehicle[1].trim();
      const key = normalizeCompare(value);
      const alreadyListed =
        key === primaryVehicleKey || additionalVehicles.some((v) => normalizeCompare(v) === key);
      if (value && !alreadyListed) additionalVehicles.push(value);
      continue;
    }
    leftover.push(line);
  }

  const body = leftover.join('\n').trim();
  const serviceKey = normalizeCompare(service);
  const bodyKey = normalizeCompare(body);
  const serviceRepeatsAsk =
    Boolean(serviceKey) &&
    Boolean(bodyKey) &&
    (serviceKey === bodyKey || bodyKey.includes(serviceKey) || serviceKey.includes(bodyKey));

  if (service && !serviceRepeatsAsk && !serviceLooksLikeFreeText(service)) {
    return {
      headline: service,
      body: bodyKey === serviceKey ? '' : body,
      preferredTiming,
      additionalVehicles,
    };
  }

  return {
    headline: '',
    body: body || service,
    preferredTiming,
    additionalVehicles,
  };
}
