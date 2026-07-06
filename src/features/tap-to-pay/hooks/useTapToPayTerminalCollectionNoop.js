const EXPO_GO_MESSAGE = 'Tap to Pay needs a development build. It is not available in Expo Go.';

/**
 * Expo Go stub — Stripe Terminal is not available.
 */
export function useTapToPayTerminalCollection() {
  return {
    collectPayment: async () => {
      throw new Error(EXPO_GO_MESSAGE);
    },
    prewarmReaderForCollect: async () => {
      throw new Error(EXPO_GO_MESSAGE);
    },
  };
}
