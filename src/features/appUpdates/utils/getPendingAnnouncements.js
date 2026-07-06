/**
 * @param {readonly import('../constants/announcements').WhatsNewAnnouncement[]} announcements
 * @param {readonly string[]} seenIds
 * @param {{ platform?: string }} [options]
 */
export function getPendingAnnouncements(announcements, seenIds, options = {}) {
  const seen = new Set(seenIds);
  const platform = options.platform?.toLowerCase();

  return announcements.filter((entry) => {
    if (!entry?.id || seen.has(entry.id)) {
      return false;
    }
    if (entry.platforms?.length && platform) {
      return entry.platforms.includes(platform);
    }
    return true;
  });
}
