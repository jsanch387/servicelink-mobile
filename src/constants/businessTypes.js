/**
 * Industry catalog — `business_profiles.business_type`.
 * Values, labels, aliases, and templates must match web `businessTypes.ts`.
 */

/** @typedef {'vehicle' | 'pet' | 'property' | 'person'} IndustryTemplate */

/**
 * @typedef {{
 *   value: string;
 *   label: string;
 *   slug: string;
 *   template: IndustryTemplate;
 *   assetKind: 'vehicle' | 'pet' | 'property' | 'none';
 *   offeredAtSignup: boolean;
 *   aliases?: readonly string[];
 *   typeHelper: string;
 * }} BusinessTypeDefinition
 */

/**
 * @typedef {{
 *   value: string | null;
 *   label: string;
 *   slug: string;
 *   template: IndustryTemplate;
 *   assetKind: 'vehicle' | 'pet' | 'property' | 'none';
 *   showVehicleFields: boolean;
 *   showPetFields: boolean;
 *   typeHelper: string;
 * }} BusinessIndustry
 */

const VEHICLE_HELPER =
  'Detailing, tint, glass, repairs — customers add their vehicle when they book.';
const PET_HELPER = 'Grooming and other pet jobs — customers add their pet when they book.';
const PROPERTY_HELPER =
  'Washing, exterior, and home jobs — customers add their address when they book.';
const GENERIC_HELPER = 'We use this so your booking form matches what you offer.';

const FALLBACK_INDUSTRY = {
  value: null,
  label: 'Business',
  slug: 'unknown',
  template: 'person',
  assetKind: 'none',
  showVehicleFields: false,
  showPetFields: false,
  typeHelper: GENERIC_HELPER,
};

/** @type {readonly BusinessTypeDefinition[]} */
const BUSINESS_TYPE_CATALOG = [
  {
    value: 'Vehicle Services',
    label: 'Vehicle services',
    slug: 'vehicle_services',
    template: 'vehicle',
    assetKind: 'vehicle',
    offeredAtSignup: true,
    typeHelper: VEHICLE_HELPER,
  },
  {
    value: 'Pet Services',
    label: 'Pet services',
    slug: 'pet_services',
    template: 'pet',
    assetKind: 'pet',
    offeredAtSignup: true,
    typeHelper: PET_HELPER,
  },
  {
    value: 'Property Services',
    label: 'Property services',
    slug: 'property_services',
    template: 'property',
    assetKind: 'property',
    offeredAtSignup: true,
    typeHelper: PROPERTY_HELPER,
  },
  {
    value: 'Other',
    label: 'Other',
    slug: 'other',
    template: 'person',
    assetKind: 'none',
    offeredAtSignup: true,
    typeHelper:
      "Don't see your kind of job? Pick this — you can still take bookings and run the business.",
  },
  {
    value: 'Auto & Detailing',
    label: 'Auto detailing',
    slug: 'auto_detailing',
    template: 'vehicle',
    assetKind: 'vehicle',
    offeredAtSignup: false,
    aliases: ['Mobile Detailing', 'Automotive', 'Service Provider'],
    typeHelper: VEHICLE_HELPER,
  },
  {
    value: 'Window Tinting',
    label: 'Window tinting',
    slug: 'window_tinting',
    template: 'vehicle',
    assetKind: 'vehicle',
    offeredAtSignup: false,
    typeHelper: VEHICLE_HELPER,
  },
  {
    value: 'Mobile Repair',
    label: 'Mobile mechanic / repair',
    slug: 'mobile_repair',
    template: 'vehicle',
    assetKind: 'vehicle',
    offeredAtSignup: false,
    typeHelper: VEHICLE_HELPER,
  },
  {
    value: 'Pet Grooming',
    label: 'Pet grooming',
    slug: 'pet_grooming',
    template: 'pet',
    assetKind: 'pet',
    offeredAtSignup: false,
    typeHelper: PET_HELPER,
  },
  {
    value: 'Pressure Washing',
    label: 'Pressure washing',
    slug: 'pressure_washing',
    template: 'property',
    assetKind: 'property',
    offeredAtSignup: false,
    typeHelper: PROPERTY_HELPER,
  },
  {
    value: 'Cleaning Services',
    label: 'Cleaning Services',
    slug: 'cleaning_services',
    template: 'property',
    assetKind: 'property',
    offeredAtSignup: false,
    typeHelper: PROPERTY_HELPER,
  },
  {
    value: 'Trash & Bin Cleaning',
    label: 'Trash & Bin Cleaning',
    slug: 'trash_bin_cleaning',
    template: 'property',
    assetKind: 'property',
    offeredAtSignup: false,
    typeHelper: PROPERTY_HELPER,
  },
  {
    value: 'Lawn Care & Landscaping',
    label: 'Lawn Care & Landscaping',
    slug: 'lawn_care',
    template: 'property',
    assetKind: 'property',
    offeredAtSignup: false,
    typeHelper: PROPERTY_HELPER,
  },
  {
    value: 'Beauty',
    label: 'Beauty',
    slug: 'beauty',
    template: 'person',
    assetKind: 'none',
    offeredAtSignup: false,
    typeHelper: GENERIC_HELPER,
  },
];

function normalizeTypeKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function definitionToIndustry(definition) {
  return {
    value: definition.value,
    label: definition.label,
    slug: definition.slug,
    template: definition.template,
    assetKind: definition.assetKind,
    showVehicleFields: definition.assetKind === 'vehicle',
    showPetFields: definition.assetKind === 'pet',
    typeHelper: definition.typeHelper,
  };
}

export function findBusinessTypeDefinition(businessType) {
  if (businessType == null || !String(businessType).trim()) return null;
  const key = normalizeTypeKey(businessType);

  for (const definition of BUSINESS_TYPE_CATALOG) {
    if (normalizeTypeKey(definition.value) === key) return definition;
    if (definition.aliases?.some((alias) => normalizeTypeKey(alias) === key)) {
      return definition;
    }
  }

  return null;
}

export function resolveBusinessIndustry(businessType) {
  const definition = findBusinessTypeDefinition(businessType);
  return definition ? definitionToIndustry(definition) : FALLBACK_INDUSTRY;
}

export function getIndustryOnboardingCopy(businessType) {
  const industry = resolveBusinessIndustry(businessType);
  return { typeHelper: industry.typeHelper };
}

export function canonicalizeBusinessType(businessType) {
  const trimmed = String(businessType ?? '').trim();
  if (!trimmed) return null;
  return findBusinessTypeDefinition(trimmed)?.value ?? trimmed;
}

export function isAllowedBusinessTypeValue(businessType) {
  return findBusinessTypeDefinition(businessType) != null;
}

function toSelectOption(definition) {
  return { value: definition.value, label: definition.label };
}

/** New signups — only types we can actually serve. */
export const BUSINESS_TYPE_OPTIONS = BUSINESS_TYPE_CATALOG.filter(
  (definition) => definition.offeredAtSignup,
).map(toSelectOption);

/**
 * Offered types plus the current stored value when it is a hidden legacy type.
 *
 * @param {string | null | undefined} currentValue
 */
export function getBusinessTypeSelectOptions(currentValue) {
  const options = [...BUSINESS_TYPE_OPTIONS];
  const current = String(currentValue ?? '').trim();
  if (!current) return options;
  if (options.some((option) => option.value === current)) return options;

  const definition = findBusinessTypeDefinition(current);
  return [
    {
      value: current,
      label: definition?.label ?? current,
    },
    ...options,
  ];
}

export function isVehicleRelatedBusinessType(businessType) {
  return resolveBusinessIndustry(businessType).showVehicleFields;
}

export function isPetRelatedBusinessType(businessType) {
  return resolveBusinessIndustry(businessType).showPetFields;
}
