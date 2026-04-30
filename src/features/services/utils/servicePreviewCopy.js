/** Matches booking-link service cards and create-appointment preview. */
export const SERVICE_DESCRIPTION_PREVIEW_CHARS = 100;

/**
 * @param {{ description?: string; isLongDescription?: boolean }} service
 * @param {boolean} isExpanded
 */
export function getServiceDescriptionCopy(service, isExpanded) {
  if (!service.isLongDescription || isExpanded) {
    return service.description;
  }
  return `${service.description.slice(0, SERVICE_DESCRIPTION_PREVIEW_CHARS).trimEnd()}...`;
}
