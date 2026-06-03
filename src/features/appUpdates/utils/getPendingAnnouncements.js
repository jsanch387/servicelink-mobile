/**
 * @param {readonly import('../constants/announcements').WhatsNewAnnouncement[]} announcements
 * @param {readonly string[]} seenIds
 */
export function getPendingAnnouncements(announcements, seenIds) {
  const seen = new Set(seenIds);
  return announcements.filter((entry) => entry?.id && !seen.has(entry.id));
}
