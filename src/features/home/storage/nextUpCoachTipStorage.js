import AsyncStorage from '@react-native-async-storage/async-storage';

export const NEXT_UP_COACH_TIPS_SEEN_KEY = 'servicelink.nextUp.coachTipsSeen';

/** @param {unknown} raw */
export function parseSeenNextUpCoachTipIds(raw) {
  if (raw == null || raw === '') {
    return [];
  }
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry) => typeof entry === 'string' && entry.trim() !== '');
  } catch {
    return [];
  }
}

export async function readSeenNextUpCoachTipIds() {
  try {
    const raw = await AsyncStorage.getItem(NEXT_UP_COACH_TIPS_SEEN_KEY);
    return parseSeenNextUpCoachTipIds(raw);
  } catch {
    return [];
  }
}

/** @param {string[]} ids */
export async function writeSeenNextUpCoachTipIds(ids) {
  try {
    await AsyncStorage.setItem(NEXT_UP_COACH_TIPS_SEEN_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

/** @param {string} id */
export async function markNextUpCoachTipSeen(id) {
  const trimmed = String(id ?? '').trim();
  if (!trimmed) {
    return;
  }
  const current = await readSeenNextUpCoachTipIds();
  if (current.includes(trimmed)) {
    return;
  }
  await writeSeenNextUpCoachTipIds([...current, trimmed]);
}

export async function clearSeenNextUpCoachTips() {
  try {
    await AsyncStorage.removeItem(NEXT_UP_COACH_TIPS_SEEN_KEY);
  } catch {
    /* ignore */
  }
}
