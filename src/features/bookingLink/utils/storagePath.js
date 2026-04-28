/** Same bucket as web: owner media + portfolio. */
export const BUSINESS_IMAGES_BUCKET = 'business_images';

/**
 * Normalize DB / UI storage paths to the key passed to `storage.from(bucket).remove/getPublicUrl`.
 *
 * @param {string | null | undefined} value
 * @param {string} [bucketName]
 * @returns {string}
 */
export function normalizeStoredBusinessImagePath(value, bucketName = BUSINESS_IMAGES_BUCKET) {
  let path = String(value ?? '').trim();
  if (!path) return '';
  path = path.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/[^/]+\//i, '');
  path = path.replace(/\?.*$/, '');
  path = path.replace(/^\/+/, '');
  if (bucketName && path.startsWith(`${bucketName}/`)) {
    path = path.slice(bucketName.length + 1);
  }
  return path;
}

/**
 * Portfolio rows must live under this prefix (parity with web `generateStoragePath` portfolio type).
 *
 * @param {string} businessId
 * @param {string} path
 */
export function isBusinessPortfolioStoragePath(businessId, path) {
  const p = normalizeStoredBusinessImagePath(path);
  const prefix = `businesses/${businessId}/portfolio/`;
  return Boolean(p && p.startsWith(prefix));
}

/**
 * @param {Record<string, unknown>} row from `business_images` select
 * @param {string} businessId
 * @returns {string} normalized path or '' if missing / invalid
 */
export function portfolioRowStoragePath(row, businessId) {
  if (!businessId) return '';
  const raw = row?.storage_path ?? row?.storagePath ?? '';
  const p = normalizeStoredBusinessImagePath(raw);
  if (!p || !p.includes('businesses/')) return '';
  if (!isBusinessPortfolioStoragePath(businessId, p)) return '';
  return p;
}
