import { supabase } from '../../../lib/supabase';
import { normalizePhoneForDatabase } from '../../../utils/phone';
import { buildServiceArea } from '../utils/serviceArea';
import {
  BUSINESS_IMAGES_BUCKET,
  isBusinessPortfolioStoragePath,
  normalizeStoredBusinessImagePath,
} from '../utils/storagePath';

const MEDIA_BUCKET = BUSINESS_IMAGES_BUCKET;

/**
 * Persists booking link text fields and optional logo/cover/gallery updates.
 * Prefer building arguments with `buildSaveBookingLinkTextVariables` (`utils/bookingLinkTextSave`).
 *
 * Gallery (when `input.gallery` is set): upload new files first, then replace `business_images` rows
 * and reconcile storage (web parity — see product spec).
 *
 * @param {object} input
 * @param {string} input.userId
 * @param {string} input.businessId
 * @param {string} input.businessName
 * @param {string} input.businessType
 * @param {string} input.city
 * @param {string} input.state
 * @param {string} input.bio
 * @param {string} input.phoneInput
 * @param {string | null | undefined} [input.logoImageUri]
 * @param {string | null | undefined} [input.coverImageUri]
 * @param {string | null | undefined} [input.previousLogoPath]
 * @param {string | null | undefined} [input.previousBannerPath]
 * @param {{ existingOrderedStoragePaths: string[], newLocalUrisOrdered: string[] } | undefined} [input.gallery]
 * @returns {Promise<void>}
 */
export async function saveOwnerBookingLink(input) {
  const {
    userId,
    businessId,
    businessName,
    businessType,
    city,
    state,
    bio,
    phoneInput,
    logoImageUri,
    coverImageUri,
    previousLogoPath,
    previousBannerPath,
    gallery,
  } = input;

  if (!userId || !businessId) {
    throw new Error('Missing account or business profile.');
  }

  let name = String(businessName ?? '').trim();
  let type = String(businessType ?? '').trim();

  if (!name || !type) {
    const { data: existing, error: existingErr } = await supabase
      .from('business_profiles')
      .select('business_name,business_type')
      .eq('id', businessId)
      .eq('profile_id', userId)
      .maybeSingle();
    if (existingErr) {
      throw new Error(existingErr.message ?? 'Could not load profile for save');
    }
    if (!name) name = String(existing?.business_name ?? '').trim();
    if (!type) type = String(existing?.business_type ?? '').trim();
  }

  if (!name) {
    throw new Error('Business name is required.');
  }
  if (!type) {
    throw new Error('Business type is required.');
  }

  const serviceArea = buildServiceArea(city, state);
  const phoneDb = normalizePhoneForDatabase(phoneInput);
  const bioText = String(bio ?? '').trim();

  const [logoResult, bannerResult] = await Promise.all([
    logoImageUri
      ? replaceBusinessImage({
          businessId,
          imageUri: logoImageUri,
          kind: 'logo',
          previousPathHint: previousLogoPath,
          userId,
        })
      : Promise.resolve(null),
    coverImageUri
      ? replaceBusinessImage({
          businessId,
          imageUri: coverImageUri,
          kind: 'banner',
          previousPathHint: previousBannerPath,
          userId,
        })
      : Promise.resolve(null),
  ]);

  /** New portfolio paths uploaded this save (rolled back if profile update fails). */
  let uploadedPortfolioPaths = [];
  if (gallery) {
    const uris = gallery.newLocalUrisOrdered ?? [];
    if (uris.length) {
      try {
        uploadedPortfolioPaths = await uploadPortfolioBatch(businessId, uris);
      } catch (e) {
        await Promise.all([
          logoResult ? safeDeleteStorageObject(logoResult.storagePath) : Promise.resolve(),
          bannerResult ? safeDeleteStorageObject(bannerResult.storagePath) : Promise.resolve(),
        ]);
        throw e;
      }
    }
  }

  const existingGalleryPaths = filterPortfolioPathsForBusiness(
    businessId,
    gallery?.existingOrderedStoragePaths ?? [],
  );
  const finalGalleryPaths = gallery ? [...existingGalleryPaths, ...uploadedPortfolioPaths] : [];

  const updateRow = {
    business_name: name,
    business_type: type,
    service_area: serviceArea,
    bio: bioText || null,
    phone_number_call: phoneDb,
    ...(logoResult ? { logo_path: logoResult.storagePath } : {}),
    ...(bannerResult ? { banner_path: bannerResult.storagePath } : {}),
  };

  const { error: updateError } = await supabase
    .from('business_profiles')
    .update(updateRow)
    .eq('id', businessId)
    .eq('profile_id', userId);

  if (updateError) {
    await Promise.all([
      logoResult ? safeDeleteStorageObject(logoResult.storagePath) : Promise.resolve(),
      bannerResult ? safeDeleteStorageObject(bannerResult.storagePath) : Promise.resolve(),
      ...uploadedPortfolioPaths.map((p) => safeDeleteStorageObject(p)),
    ]);
    throw new Error(updateError.message ?? 'Could not save profile');
  }

  if (gallery) {
    try {
      await reconcileGalleryImagesStrict({
        businessId,
        finalOrderedPaths: finalGalleryPaths,
      });
    } catch (e) {
      await Promise.all(uploadedPortfolioPaths.map((p) => safeDeleteStorageObject(p)));
      throw e;
    }
  }
}

function filterPortfolioPathsForBusiness(businessId, paths) {
  const out = [];
  for (const raw of paths) {
    const p = normalizeStoredBusinessImagePath(raw);
    if (isBusinessPortfolioStoragePath(businessId, p)) {
      out.push(p);
    }
  }
  return out;
}

/**
 * Web `updateImages` parity: delete orphaned storage, wipe rows, insert ordered rows.
 * Storage delete failure aborts before any DB write.
 */
async function reconcileGalleryImagesStrict({ businessId, finalOrderedPaths }) {
  const { data: currentRows, error: fetchErr } = await supabase
    .from('business_images')
    .select('storage_path')
    .eq('business_id', businessId);
  if (fetchErr) {
    throw new Error(fetchErr.message ?? 'Could not load gallery');
  }

  const currentPaths = (currentRows ?? [])
    .map((r) => normalizeStoredBusinessImagePath(r?.storage_path))
    .filter((p) => isBusinessPortfolioStoragePath(businessId, p));

  const newSet = new Set(finalOrderedPaths);
  const pathsToDelete = currentPaths.filter((p) => !newSet.has(p));

  if (pathsToDelete.length) {
    const { error: storageDelErr } = await supabase.storage
      .from(MEDIA_BUCKET)
      .remove(pathsToDelete);
    if (storageDelErr) {
      throw new Error(storageDelErr.message ?? 'Could not remove old gallery files from storage');
    }
  }

  const { error: delDbErr } = await supabase
    .from('business_images')
    .delete()
    .eq('business_id', businessId);
  if (delDbErr) {
    throw new Error(delDbErr.message ?? 'Could not update gallery');
  }

  if (!finalOrderedPaths.length) {
    return;
  }

  const rows = finalOrderedPaths.map((storage_path, position) => ({
    business_id: businessId,
    storage_path,
    position,
  }));

  const { error: insErr } = await supabase.from('business_images').insert(rows);
  if (insErr) {
    const { error: rollbackErr } = await supabase.storage
      .from(MEDIA_BUCKET)
      .remove(finalOrderedPaths);
    if (rollbackErr) {
      throw new Error(
        `${insErr.message ?? 'Could not save gallery'}. Also failed to clean up new files: ${rollbackErr.message ?? ''}`,
      );
    }
    throw new Error(insErr.message ?? 'Could not save gallery');
  }
}

/**
 * All-or-nothing uploads for one save batch (web `uploadPortfolio` parity).
 *
 * @param {string} businessId
 * @param {string[]} uris
 * @returns {Promise<string[]>} storage paths in order
 */
async function uploadPortfolioBatch(businessId, uris) {
  const uploaded = [];
  try {
    for (const uri of uris) {
      const ext = inferImageExtension(uri);
      const storagePath = `businesses/${businessId}/portfolio/${makeFileId()}.${ext}`;
      const fileData = await loadImageArrayBuffer(uri);
      const contentType = getImageContentType(ext);
      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(storagePath, fileData, {
          contentType,
          upsert: false,
        });
      if (uploadError) {
        throw new Error(uploadError.message ?? 'Could not upload gallery image');
      }
      uploaded.push(storagePath);
    }
    return uploaded;
  } catch (e) {
    for (const p of uploaded) {
      await safeDeleteStorageObject(p);
    }
    throw e instanceof Error ? e : new Error('Could not upload gallery image');
  }
}

async function replaceBusinessImage({ businessId, imageUri, kind, previousPathHint, userId }) {
  const { data: currentRow, error: currentRowError } = await supabase
    .from('business_profiles')
    .select(kind === 'logo' ? 'logo_path' : 'banner_path')
    .eq('id', businessId)
    .eq('profile_id', userId)
    .maybeSingle();
  if (currentRowError) {
    throw new Error(currentRowError.message ?? `Could not read current ${kind} image`);
  }

  const dbPath = kind === 'logo' ? currentRow?.logo_path : currentRow?.banner_path;
  const oldPath = normalizeStoredBusinessImagePath(dbPath ?? previousPathHint);
  if (oldPath) {
    await safeDeleteStorageObject(oldPath);
  }

  const ext = inferImageExtension(imageUri);
  const storagePath = `businesses/${businessId}/${kind}/${makeFileId()}.${ext}`;
  const fileData = await loadImageArrayBuffer(imageUri);
  const contentType = getImageContentType(ext);

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, fileData, {
      contentType,
      upsert: false,
    });
  if (uploadError) {
    throw new Error(uploadError.message ?? `Could not upload ${kind} image`);
  }

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
  return { publicUrl: data?.publicUrl ?? null, storagePath };
}

async function loadImageArrayBuffer(uri) {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Could not read selected image');
  }
  return response.arrayBuffer();
}

async function safeDeleteStorageObject(path) {
  const normalized = normalizeStoredBusinessImagePath(path);
  if (!normalized) return;
  try {
    await supabase.storage.from(MEDIA_BUCKET).remove([normalized]);
  } catch {
    /* best-effort */
  }
}

function makeFileId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function inferImageExtension(uri) {
  const match = String(uri ?? '')
    .toLowerCase()
    .match(/\.([a-z0-9]+)(?:\?|$)/);
  const ext = match?.[1] || 'jpg';
  if (ext === 'jpeg') return 'jpg';
  if (ext === 'heic') return 'jpg';
  if (ext === 'png' || ext === 'webp' || ext === 'gif' || ext === 'jpg') return ext;
  return 'jpg';
}

function getImageContentType(ext) {
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}
