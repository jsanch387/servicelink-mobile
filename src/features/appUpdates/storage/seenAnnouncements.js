import AsyncStorage from '@react-native-async-storage/async-storage';

export const SEEN_APP_UPDATE_ANNOUNCEMENTS_KEY = 'servicelink.seenAppUpdateAnnouncements';

/** @param {unknown} raw */
export function parseSeenAnnouncementIds(raw) {
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

export async function readSeenAnnouncementIds() {
  try {
    const raw = await AsyncStorage.getItem(SEEN_APP_UPDATE_ANNOUNCEMENTS_KEY);
    return parseSeenAnnouncementIds(raw);
  } catch {
    return [];
  }
}

/** @param {string[]} ids */
export async function writeSeenAnnouncementIds(ids) {
  try {
    await AsyncStorage.setItem(SEEN_APP_UPDATE_ANNOUNCEMENTS_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

/** @param {string} id */
export async function markAnnouncementSeen(id) {
  const trimmed = String(id ?? '').trim();
  if (!trimmed) {
    return;
  }
  const current = await readSeenAnnouncementIds();
  if (current.includes(trimmed)) {
    return;
  }
  await writeSeenAnnouncementIds([...current, trimmed]);
}

export async function clearSeenAppUpdateAnnouncements() {
  try {
    await AsyncStorage.removeItem(SEEN_APP_UPDATE_ANNOUNCEMENTS_KEY);
  } catch {
    /* ignore */
  }
}
