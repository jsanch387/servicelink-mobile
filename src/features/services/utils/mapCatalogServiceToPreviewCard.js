import { SERVICE_DESCRIPTION_PREVIEW_CHARS } from './servicePreviewCopy';

/**
 * Maps a catalog service row (from {@link buildServicesCatalogModel}) to props for {@link ServicePreviewCard}.
 */
export function mapCatalogServiceToPreviewCard(service) {
  const description = String(service?.description ?? '').trim() || 'No description yet.';
  return {
    id: String(service?.id ?? ''),
    title: String(service?.name ?? 'Service'),
    price: String(service?.priceLabel ?? '$0'),
    description,
    isLongDescription: description.length > SERVICE_DESCRIPTION_PREVIEW_CHARS,
    duration: String(service?.durationLabel ?? '0 min'),
  };
}
