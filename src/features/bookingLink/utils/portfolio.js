/** Stable React key for a portfolio row from the API or local draft. */
export function portfolioImageKey(image) {
  return String(image?.id ?? image?.storage_path ?? image?.preview_url ?? '');
}
