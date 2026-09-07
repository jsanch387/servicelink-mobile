/**
 * Description is hidden on the onboarding form. Use the name when it is missing
 * so step 2 never fails the API / DB required-description check.
 */
export function fillOnboardingServiceDescription(service) {
  const name = String(service?.name ?? '').trim();
  const description = String(service?.description ?? '').trim() || name;
  return { ...service, name, description };
}

/**
 * Builds a save-ready onboarding service from the simplified step form.
 * Description is omitted in the UI and defaults to the service name.
 */
export function buildOnboardingServiceDraft({ id, name, priceInput, durationMinutes }) {
  const trimmedName = String(name ?? '').trim();
  if (!trimmedName) {
    return null;
  }
  const price = String(priceInput ?? '')
    .replace(/\$/g, '')
    .trim();
  return {
    id,
    name: trimmedName,
    description: trimmedName,
    priceInput: price || '0',
    durationMinutes: Math.max(30, Number(durationMinutes) || 60),
  };
}
