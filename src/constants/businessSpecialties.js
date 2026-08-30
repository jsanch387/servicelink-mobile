/**
 * Marketplace niches — `business_profiles.specialties` (`text[]`).
 * Slugs and labels must match web `businessSpecialties.ts`.
 */

import { resolveBusinessIndustry } from './businessTypes';

export const BUSINESS_SPECIALTY_SLUGS = [
  'detailing',
  'window_tinting',
  'auto_glass',
  'mobile_repair',
  'pet_grooming',
  'pressure_washing',
  'carpet_cleaning',
  'home_cleaning',
  'lawn_care',
  'other',
];

const SPECIALTY_LABELS = {
  detailing: 'Auto detailing',
  window_tinting: 'Window tinting',
  auto_glass: 'Auto glass',
  mobile_repair: 'Mobile mechanic',
  pet_grooming: 'Pet grooming',
  pressure_washing: 'Pressure washing',
  carpet_cleaning: 'Carpet cleaning',
  home_cleaning: 'Home cleaning',
  lawn_care: 'Lawn care',
  other: 'Other',
};

const SPECIALTIES_BY_TEMPLATE = {
  vehicle: ['detailing', 'window_tinting', 'auto_glass', 'mobile_repair', 'other'],
  pet: ['pet_grooming', 'other'],
  property: ['pressure_washing', 'carpet_cleaning', 'home_cleaning', 'lawn_care', 'other'],
  person: ['other'],
};

const LEGACY_TYPE_SPECIALTIES = {
  'auto & detailing': ['detailing'],
  'mobile detailing': ['detailing'],
  automotive: ['detailing'],
  'service provider': ['detailing'],
  'window tinting': ['window_tinting'],
  'mobile repair': ['mobile_repair'],
  'pet grooming': ['pet_grooming'],
  'pressure washing': ['pressure_washing'],
  'cleaning services': ['home_cleaning'],
  'trash & bin cleaning': ['other'],
  'lawn care & landscaping': ['lawn_care'],
  beauty: ['other'],
};

const SLUG_SET = new Set(BUSINESS_SPECIALTY_SLUGS);

export const SPECIALTIES_REQUIRED_ERROR = 'Pick at least one thing people hire you for';

export function isBusinessSpecialtySlug(value) {
  return SLUG_SET.has(value);
}

export function sanitizeBusinessSpecialties(values) {
  if (!values?.length) return [];
  const seen = new Set();
  const next = [];
  for (const value of values) {
    const slug = String(value ?? '')
      .trim()
      .toLowerCase();
    if (!isBusinessSpecialtySlug(slug) || seen.has(slug)) continue;
    seen.add(slug);
    next.push(slug);
  }
  return next;
}

export function specialtiesFingerprint(values) {
  return sanitizeBusinessSpecialties(values).slice().sort().join('\u0001');
}

export function getSpecialtiesForBusinessType(businessType) {
  const template = resolveBusinessIndustry(businessType).template;
  return SPECIALTIES_BY_TEMPLATE[template].map((slug) => ({
    slug,
    label: SPECIALTY_LABELS[slug],
  }));
}

export function specialtiesAllowedForBusinessType(businessType, current) {
  const allowed = new Set(getSpecialtiesForBusinessType(businessType).map((option) => option.slug));
  const kept = sanitizeBusinessSpecialties(current).filter((slug) => allowed.has(slug));
  if (businessType === 'Other' && kept.length === 0) return ['other'];
  return kept;
}

export function deriveSpecialtiesFromBusinessType(businessType) {
  const key = String(businessType ?? '')
    .trim()
    .toLowerCase();
  if (!key) return [];
  return [...(LEGACY_TYPE_SPECIALTIES[key] ?? [])];
}

export function resolveBusinessSpecialties(businessType, storedSpecialties) {
  const saved = sanitizeBusinessSpecialties(storedSpecialties);
  if (saved.length > 0) return saved;
  return deriveSpecialtiesFromBusinessType(businessType);
}

export function hasDetailingMarketplaceListing(businessType, storedSpecialties) {
  return resolveBusinessSpecialties(businessType, storedSpecialties).includes('detailing');
}
