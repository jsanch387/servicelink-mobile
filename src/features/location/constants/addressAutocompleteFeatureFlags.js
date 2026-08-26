import { hasMapTilerApiKey } from '../services/locationAutocomplete';

/**
 * Appointment (and shared) street-address search via MapTiler.
 * Flip to `false` to force the manual street / city / state / ZIP form
 * if MapTiler is down, too expensive, or you want the old UX back.
 */
export const ADDRESS_AUTOCOMPLETE_ENABLED = true;

/** Search is offered only when the flag is on and a MapTiler key is present. */
export function isAddressAutocompleteAvailable() {
  return ADDRESS_AUTOCOMPLETE_ENABLED && hasMapTilerApiKey();
}
