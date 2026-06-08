/**
 * @param {{ id: string }[]} catalogCategories
 * @param {{ id: string }[]} draftCategories
 */
export function hasCategoryOrderChanges(catalogCategories, draftCategories) {
  const baseIds = (catalogCategories ?? []).map((category) => category.id);
  const draftIds = (draftCategories ?? []).map((category) => category.id);
  if (baseIds.length !== draftIds.length) return false;
  for (let index = 0; index < baseIds.length; index += 1) {
    if (baseIds[index] !== draftIds[index]) return true;
  }
  return false;
}
