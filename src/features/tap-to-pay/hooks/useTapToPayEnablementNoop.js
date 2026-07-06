/**
 * Expo Go stub — Stripe Terminal is not available.
 */
export function useTapToPayEnablement() {
  return {
    canEnable: false,
    isEnabled: false,
    isOptedIn: false,
    isReaderReady: false,
    needsReconnect: false,
    checking: false,
    isEnabling: false,
    enable: async () => false,
    refresh: async () => {},
  };
}
