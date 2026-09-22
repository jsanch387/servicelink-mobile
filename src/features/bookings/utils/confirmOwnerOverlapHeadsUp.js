import { Alert } from 'react-native';

/**
 * Heads-up only. Continue still saves.
 *
 * @param {string | null | undefined} message
 * @returns {Promise<boolean>}
 */
export function confirmOwnerOverlapHeadsUp(message) {
  const copy = String(message ?? '').trim();
  if (!copy) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    Alert.alert(copy, undefined, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Continue', onPress: () => resolve(true) },
    ]);
  });
}
