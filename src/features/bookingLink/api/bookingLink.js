import { supabase } from '../../../lib/supabase';
import { fetchServiceCategories } from '../../services/categories/api/serviceCategories';
import { hasProAccessFromProfile } from '../../more/utils/subscriptionPresentation';

const MEDIA_BUCKET_NAME = 'business_images';

/**
 * @typedef {object} MobileBusinessProfile
 * @property {string} id
 * @property {string | null} business_name
 * @property {string | null} business_type
 * @property {string | null} service_area
 * @property {string | null} business_zip
 * @property {string | null} service_location_mode
 * @property {string | null} shop_street_address
 * @property {string | null} shop_unit
 * @property {string[] | null} public_booking_locales
 * @property {string | null} public_booking_default_locale
 * @property {string | null} bio
 * @property {string | null} phone_number_call
 * @property {string | null} business_slug
 * @property {string | null} business_link
 * @property {boolean | null} accept_quote_req
 * @property {string | null} logo_path
 * @property {string | null} banner_path
 * @property {string | null} logo_url
 * @property {string | null} cover_image_url
 * @property {Array<Record<string, unknown>>} services
 * @property {Array<Record<string, unknown>>} serviceCategories
 * @property {Array<Record<string, unknown> & { preview_url: string | null }>} images
 * @property {boolean} showVerifiedBadge
 * @property {boolean} showRequestQuoteCta
 * @property {boolean} profileWelcomeModalSeen — `profiles.profile_welcome_modal_seen`
 */

const BUSINESS_PROFILE_SELECT = [
  'id',
  'business_name',
  'business_type',
  'service_area',
  'business_zip',
  'service_location_mode',
  'shop_street_address',
  'shop_unit',
  'public_booking_locales',
  'public_booking_default_locale',
  'bio',
  'phone_number_call',
  'business_slug',
  'business_link',
  'accept_quote_req',
  'logo_path',
  'banner_path',
  'profile_id',
].join(', ');

export async function fetchOwnerProfileRow(userId) {
  // `*` must include `profile_welcome_modal_seen` (booking-link welcome modal gate).
  return supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
}

/**
 * Maps `profiles.profile_welcome_modal_seen` for the welcome modal: **only** treat as seen when
 * the value is clearly true (boolean, 1, or common string forms). Anything else → show modal.
 *
 * @param {Record<string, unknown> | null | undefined} row - `profiles` row from Supabase
 * @returns {boolean}
 */
export function readProfileWelcomeModalSeenFromRow(row) {
  if (!row || typeof row !== 'object') return false;
  const v = row.profile_welcome_modal_seen;
  if (v === true || v === 1) return true;
  if (v === false || v === 0 || v === null) return false;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === 'true' || s === 't' || s === '1';
  }
  return false;
}

/**
 * Persists booking-link welcome tour completion (`profiles.profile_welcome_modal_seen`).
 * @param {string} userId
 * @returns {Promise<{ error: Error | null }>}
 */
export async function markProfileWelcomeModalSeen(userId) {
  if (!userId) {
    return { error: new Error('Not signed in') };
  }
  const { error } = await supabase
    .from('profiles')
    .update({
      profile_welcome_modal_seen: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  return { error: error ? new Error(error.message ?? 'Update failed') : null };
}

export async function fetchBusinessProfileForOwner(userId) {
  return supabase
    .from('business_profiles')
    .select(BUSINESS_PROFILE_SELECT)
    .eq('profile_id', userId)
    .maybeSingle();
}

export async function fetchBusinessProfileBySlug(slug) {
  return supabase
    .from('business_profiles')
    .select(BUSINESS_PROFILE_SELECT)
    .eq('business_slug', slug)
    .single();
}

export async function fetchBusinessServicesForPublicProfile(businessId) {
  return supabase
    .from('business_services')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });
}

export async function fetchBusinessImagesForOwnerProfile(businessId) {
  return supabase
    .from('business_images')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: true });
}

export async function fetchBusinessImagesForPublicProfile(businessId) {
  return supabase
    .from('business_images')
    .select('*')
    .eq('business_id', businessId)
    .order('position', { ascending: true });
}

/**
 * Owner dashboard flow: `auth user -> profiles -> business_profiles -> services + images`.
 * @param {string} userId
 * @returns {Promise<{ data: MobileBusinessProfile | null, error: Error | null }>}
 */
export async function fetchCompleteOwnerBusinessProfile(userId) {
  const [ownerRes, businessRes] = await Promise.all([
    fetchOwnerProfileRow(userId),
    fetchBusinessProfileForOwner(userId),
  ]);

  if (ownerRes.error) return { data: null, error: ownerRes.error };
  if (businessRes.error) return { data: null, error: businessRes.error };
  if (!businessRes.data?.id) return { data: null, error: null };

  const [servicesRes, categoriesRes, imagesRes] = await Promise.all([
    fetchBusinessServicesForPublicProfile(businessRes.data.id),
    fetchServiceCategories(businessRes.data.id),
    fetchBusinessImagesForOwnerProfile(businessRes.data.id),
  ]);

  if (servicesRes.error) return { data: null, error: servicesRes.error };
  if (imagesRes.error) return { data: null, error: imagesRes.error };

  const normalized = await normalizeMobileBusinessProfile({
    businessProfileRow: businessRes.data,
    ownerProfileRow: ownerRes.data,
    servicesRows: servicesRes.data ?? [],
    categoryRows: categoriesRes.error ? [] : (categoriesRes.data ?? []),
    imagesRows: imagesRes.data ?? [],
  });

  return { data: normalized, error: null };
}

/**
 * Public route flow: `slug -> business_profiles -> active services + images -> owner profiles`.
 * @param {string} slug
 * @returns {Promise<{ data: MobileBusinessProfile | null, error: Error | null }>}
 */
export async function fetchCompletePublicBusinessProfileBySlug(slug) {
  const businessRes = await fetchBusinessProfileBySlug(slug);
  if (businessRes.error) return { data: null, error: businessRes.error };

  const business = businessRes.data;
  const ownerId = business?.profile_id ?? null;
  const [servicesRes, categoriesRes, imagesRes, ownerRes] = await Promise.all([
    fetchBusinessServicesForPublicProfile(business.id),
    fetchServiceCategories(business.id),
    fetchBusinessImagesForPublicProfile(business.id),
    ownerId ? fetchOwnerProfileRow(ownerId) : Promise.resolve({ data: null, error: null }),
  ]);

  if (servicesRes.error) return { data: null, error: servicesRes.error };
  if (imagesRes.error) return { data: null, error: imagesRes.error };
  if (ownerRes.error) return { data: null, error: ownerRes.error };

  return {
    data: await normalizeMobileBusinessProfile({
      businessProfileRow: business,
      ownerProfileRow: ownerRes.data,
      servicesRows: servicesRes.data ?? [],
      categoryRows: categoriesRes.error ? [] : (categoriesRes.data ?? []),
      imagesRows: imagesRes.data ?? [],
    }),
    error: null,
  };
}

export async function normalizeMobileBusinessProfile({
  businessProfileRow,
  ownerProfileRow,
  servicesRows,
  categoryRows = [],
  imagesRows,
}) {
  const hasPro = hasProAccessFromProfile(ownerProfileRow);
  const cacheVersion = Date.now();
  const logoUrl = getMediaPublicUrl(businessProfileRow?.logo_path, cacheVersion);
  const bannerUrl = getMediaPublicUrl(businessProfileRow?.banner_path, cacheVersion);

  const images = await Promise.all(
    (imagesRows ?? []).map(async (row) => ({
      ...row,
      preview_url: getMediaPublicUrl(row?.storage_path, cacheVersion),
    })),
  );

  return {
    id: String(businessProfileRow?.id ?? ''),
    profileWelcomeModalSeen: readProfileWelcomeModalSeenFromRow(ownerProfileRow),
    business_name: cleanTextOrNull(businessProfileRow?.business_name),
    business_type: cleanTextOrNull(businessProfileRow?.business_type),
    service_area: cleanTextOrNull(businessProfileRow?.service_area),
    business_zip: cleanTextOrNull(businessProfileRow?.business_zip),
    service_location_mode: cleanTextOrNull(businessProfileRow?.service_location_mode),
    shop_street_address: cleanTextOrNull(businessProfileRow?.shop_street_address),
    shop_unit: cleanTextOrNull(businessProfileRow?.shop_unit),
    public_booking_locales: Array.isArray(businessProfileRow?.public_booking_locales)
      ? businessProfileRow.public_booking_locales.filter((l) => l === 'en' || l === 'es')
      : null,
    public_booking_default_locale: cleanTextOrNull(
      businessProfileRow?.public_booking_default_locale,
    ),
    bio: cleanTextOrNull(businessProfileRow?.bio),
    phone_number_call: cleanTextOrNull(businessProfileRow?.phone_number_call),
    business_slug: cleanTextOrNull(businessProfileRow?.business_slug),
    business_link: cleanTextOrNull(businessProfileRow?.business_link),
    accept_quote_req:
      typeof businessProfileRow?.accept_quote_req === 'boolean'
        ? businessProfileRow.accept_quote_req
        : null,
    logo_path: cleanTextOrNull(businessProfileRow?.logo_path),
    banner_path: cleanTextOrNull(businessProfileRow?.banner_path),
    logo_url: logoUrl,
    cover_image_url: bannerUrl,
    services: servicesRows ?? [],
    serviceCategories: categoryRows ?? [],
    images,
    showVerifiedBadge: hasPro,
    showRequestQuoteCta: hasPro && businessProfileRow?.accept_quote_req === true,
  };
}

/** Same as `SubscriptionContext.hasProAccess` / web `isProAccess` — single source of truth. */
export function ownerHasProAccess(ownerProfileRow) {
  return hasProAccessFromProfile(ownerProfileRow);
}

function getMediaPublicUrl(storagePath, cacheVersion) {
  const raw = cleanTextOrNull(storagePath);
  if (!raw) return null;

  const path = normalizeStoragePath(raw, MEDIA_BUCKET_NAME);
  if (!path) return null;
  const { data } = supabase.storage.from(MEDIA_BUCKET_NAME).getPublicUrl(path);
  return data?.publicUrl ? appendVersion(data.publicUrl, cacheVersion) : null;
}

function normalizeStoragePath(value, bucketName) {
  let path = String(value ?? '').trim();
  if (!path) return '';

  // Defensive normalization for legacy rows; canonical value is relative storage path only.
  path = path.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/[^/]+\//i, '');
  path = path.replace(/\?.*$/, '');
  path = path.replace(/^\/+/, '');

  // Some rows store `bucket/path/to/file`; web still treats DB value as storage path.
  if (bucketName && path.startsWith(`${bucketName}/`)) {
    path = path.slice(bucketName.length + 1);
  }

  return path;
}

function appendVersion(url, version) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${version}`;
}

function cleanTextOrNull(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}
