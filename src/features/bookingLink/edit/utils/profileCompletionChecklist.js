import { sanitizeBusinessSpecialties } from '../../../../constants/businessSpecialties';

/**
 * @typedef {object} ProfileCompletionChecklistItem
 * @property {string} id
 * @property {string} label
 * @property {boolean} complete
 */

/**
 * @param {{
 *   hasCover?: boolean,
 *   hasLogo?: boolean,
 *   nameInput?: string,
 *   typeInput?: string,
 *   specialtiesInput?: string[],
 *   cityInput?: string,
 *   stateInput?: string,
 *   zipInput?: string,
 *   phoneInput?: string,
 *   bioInput?: string,
 *   serviceTypeInput?: string,
 *   shopStreetInput?: string,
 *   galleryImageCount?: number,
 * }} input
 */
export function buildProfileCompletionChecklist(input) {
  const hasLocation =
    Boolean(String(input.cityInput ?? '').trim()) && Boolean(String(input.stateInput ?? '').trim());

  /** @type {ProfileCompletionChecklistItem[]} */
  const items = [
    {
      id: 'cover',
      label: 'Cover photo',
      complete: Boolean(input.hasCover),
    },
    {
      id: 'logo',
      label: 'Logo',
      complete: Boolean(input.hasLogo),
    },
    {
      id: 'businessName',
      label: 'Business name',
      complete: Boolean(String(input.nameInput ?? '').trim()),
    },
    {
      id: 'businessType',
      label: 'Business type',
      complete:
        Boolean(String(input.typeInput ?? '').trim()) &&
        sanitizeBusinessSpecialties(input.specialtiesInput).length > 0,
    },
    {
      id: 'location',
      label: 'Location',
      complete: hasLocation,
    },
    {
      id: 'phone',
      label: 'Phone number',
      complete: Boolean(String(input.phoneInput ?? '').replace(/\D/g, '').length >= 10),
    },
    {
      id: 'bio',
      label: 'Bio',
      complete: Boolean(String(input.bioInput ?? '').trim()),
    },
    {
      id: 'gallery',
      label: 'Gallery photo',
      complete: Number(input.galleryImageCount ?? 0) > 0,
    },
  ];

  const completeCount = items.filter((item) => item.complete).length;
  const percent = items.length ? Math.round((completeCount / items.length) * 100) : 0;

  return { items, percent };
}
