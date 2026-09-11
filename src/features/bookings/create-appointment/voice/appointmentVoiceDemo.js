/** Scripted voice demo — swap for a real agent without changing the session UI. */

import { normalizePhoneForDatabase } from '../../../../utils/phone';

export const VOICE_LISTEN_MS = 420;
/** Press longer than this is hold-to-talk; shorter is tap-to-keep-listening. */
export const VOICE_HOLD_MS = 200;

export const APPOINTMENT_VOICE_GROUPS = Object.freeze([
  {
    id: 'customer',
    title: 'Customer',
    fields: [
      { key: 'customer', label: 'Who' },
      { key: 'phone', label: 'Phone' },
    ],
  },
  {
    id: 'job',
    title: 'Service',
    fields: [
      { key: 'service', label: 'Service' },
      { key: 'pricing', label: 'Price' },
      { key: 'addons', label: 'Add-ons' },
    ],
  },
  {
    id: 'vehicle',
    title: 'Vehicle',
    fields: [
      { key: 'vehicleYear', label: 'Year' },
      { key: 'vehicleMake', label: 'Make' },
      { key: 'vehicleModel', label: 'Model' },
    ],
  },
  {
    id: 'location',
    title: 'Location',
    fields: [{ key: 'address', label: 'Address' }],
  },
  {
    id: 'schedule',
    title: 'Schedule',
    fields: [
      { key: 'date', label: 'Date' },
      { key: 'time', label: 'Time' },
    ],
  },
]);

/** Catalog stand-in — the live agent will resolve spoken add-ons to DB rows with prices. */
export const VOICE_DEMO_ADDON_CATALOG = Object.freeze([
  {
    id: 'ceramic-coat',
    name: 'Ceramic coat',
    priceLabel: '$149',
    aliases: ['ceramic coat', 'ceramic', 'ceramic coating'],
  },
]);

export function mapSpokenAddonsToCatalog(spoken) {
  const text = String(spoken ?? '').toLowerCase();
  return VOICE_DEMO_ADDON_CATALOG.filter((row) =>
    row.aliases.some((alias) => text.includes(alias)),
  ).map(({ id, name, priceLabel }) => ({ id, name, priceLabel }));
}

export const APPOINTMENT_VOICE_TURNS = Object.freeze([
  {
    id: 'open',
    phase: 'idle',
    ai: 'I’m listening.',
    user: null,
    slots: {},
  },
  {
    id: 'who-service',
    phase: 'ask',
    user: 'Full detail for Jose',
    ai: 'What’s the phone number and vehicle?',
    slots: {
      customer: 'Jose',
      service: 'Full detail',
    },
  },
  {
    id: 'phone-vehicle',
    phase: 'ask',
    user: '512-321-4324, 2019 Honda Accord',
    ai: 'Where’s the job, and which price?',
    slots: {
      customer: 'Jose',
      phone: '512-321-4324',
      service: 'Full detail',
      vehicleYear: '2019',
      vehicleMake: 'Honda',
      vehicleModel: 'Accord',
    },
  },
  {
    id: 'address-price',
    phase: 'ask',
    user: 'Thursday at 10, 412 Oak Street, sedan price',
    ai: 'Want to add any add-ons?',
    slots: {
      customer: 'Jose',
      phone: '512-321-4324',
      service: 'Full detail',
      pricing: 'Sedan · $89',
      vehicleYear: '2019',
      vehicleMake: 'Honda',
      vehicleModel: 'Accord',
      address: '412 Oak Street',
      date: '2026-09-10',
      time: '10:00 AM',
    },
  },
  {
    id: 'addons',
    phase: 'ready',
    user: 'Ceramic coat',
    ai: 'Ready — Thursday at 10 for Jose.',
    slots: {
      customer: 'Jose',
      phone: '512-321-4324',
      service: 'Full detail',
      pricing: 'Sedan · $89',
      addons: mapSpokenAddonsToCatalog('Ceramic coat'),
      vehicleYear: '2019',
      vehicleMake: 'Honda',
      vehicleModel: 'Accord',
      address: '412 Oak Street',
      date: '2026-09-10',
      time: '10:00 AM',
    },
  },
]);

export const LAST_VOICE_TURN_INDEX = APPOINTMENT_VOICE_TURNS.length - 1;

export function voiceTurnAt(index) {
  const safeIndex = Math.max(0, Math.min(index, LAST_VOICE_TURN_INDEX));
  return APPOINTMENT_VOICE_TURNS[safeIndex];
}

export function nextVoiceTurnIndex(index) {
  if (index >= LAST_VOICE_TURN_INDEX) {
    return LAST_VOICE_TURN_INDEX;
  }
  return index + 1;
}

export function isVoiceDemoReady(turn) {
  return turn?.phase === 'ready';
}

export function emptyVoiceReviewDraft() {
  return {
    customer: '',
    phone: '',
    service: '',
    pricing: '',
    addons: [],
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    address: '',
    date: '',
    time: '',
  };
}

export function voicePricingParts(pricing) {
  const raw = String(pricing ?? '').trim();
  const sep = ' · ';
  const at = raw.lastIndexOf(sep);
  if (at === -1) {
    if (raw.startsWith('$')) {
      return { option: '', price: raw };
    }
    return { option: raw, price: '' };
  }
  return {
    option: raw.slice(0, at).trim(),
    price: raw.slice(at + sep.length).trim(),
  };
}

export function parseVoiceVehicle(line) {
  const raw = String(line ?? '').trim();
  const match = raw.match(/^(\d{4})\s+(\S+)\s+(.+)$/);
  if (match) {
    return { year: match[1], make: match[2], model: match[3] };
  }
  return { year: '', make: '', model: raw };
}

export function voiceDraftVehicle(draft = {}) {
  const year = String(draft.vehicleYear ?? '').trim();
  const make = String(draft.vehicleMake ?? '').trim();
  const model = String(draft.vehicleModel ?? '').trim();
  if (year || make || model) {
    return { year, make, model };
  }
  return parseVoiceVehicle(draft.vehicle);
}

export function voiceVehicleLine(vehicle) {
  return [vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(' ');
}

export function voiceDraftAddons(draft = {}) {
  if (Array.isArray(draft.addons)) {
    return draft.addons
      .map((row, index) => ({
        id: row?.id ?? `voice-addon-${index}`,
        name: String(row?.name ?? '').trim(),
        priceLabel: String(row?.priceLabel ?? row?.price ?? '').trim(),
      }))
      .filter((row) => row.name);
  }
  const name = String(draft.addons ?? '').trim();
  return name ? [{ id: 'voice-addon', name, priceLabel: '' }] : [];
}

/** Map the voice draft onto `ReviewStep` so both booking paths share one review UI. */
export function voiceDraftToReviewStepProps(draft = {}) {
  const pricing = voicePricingParts(draft.pricing);
  const vehicle = voiceDraftVehicle(draft);
  return {
    jobs: [
      {
        localId: 'voice',
        serviceName: String(draft.service ?? '').trim() || '—',
        optionLabel: pricing.option,
        priceLabel: pricing.price || String(draft.pricing ?? '').trim() || '—',
        vehicleLine: voiceVehicleLine(vehicle),
        addonRows: voiceDraftAddons(draft),
      },
    ],
    selectedService: null,
    selectedPricingOption: null,
    serviceAddons: [],
    selectedAddonIds: [],
    selectedDateKey: String(draft.date ?? '').trim() || null,
    selectedTime: String(draft.time ?? '').trim() || null,
    customer: {
      fullName: String(draft.customer ?? '').trim(),
      phone: String(draft.phone ?? '').trim(),
    },
    address: {
      street: String(draft.address ?? '').trim(),
      unit: '',
      city: '',
      state: '',
      zip: '',
    },
    vehicle,
    notes: '',
    totalDurationMinutes: 0,
  };
}

/** Only groups that have at least one filled field — empty rows stay hidden. */
export function visibleVoiceGroups(slots = {}) {
  return APPOINTMENT_VOICE_GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    fields: group.fields.filter((field) => {
      const value = slots[field.key];
      if (Array.isArray(value)) return value.length > 0;
      return Boolean(value);
    }),
  })).filter((group) => group.fields.length > 0);
}

export function isVoiceReviewPhoneComplete(phone) {
  return normalizePhoneForDatabase(phone) != null;
}

export function voiceReviewPhoneError(phone) {
  if (isVoiceReviewPhoneComplete(phone)) {
    return null;
  }
  return String(phone ?? '').trim() ? 'Enter a valid phone number.' : 'Phone is required.';
}
