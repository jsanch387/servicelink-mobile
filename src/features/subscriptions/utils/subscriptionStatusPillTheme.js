/**
 * @param {string} tone — pillTone from resolveSubscriberPill / statusRaw on cards
 * @param {Record<string, string>} colors
 * @param {boolean} isDark
 */
export function getSubscriptionStatusPillTheme(tone, colors, isDark) {
  const key = String(tone ?? '').trim();

  if (
    key === 'past_due' ||
    key === 'unpaid' ||
    key === 'needs_visit' ||
    key === 'cancel_scheduled'
  ) {
    return {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.14)',
      borderColor: isDark ? 'rgba(245, 158, 11, 0.45)' : 'rgba(217, 119, 6, 0.35)',
      color: isDark ? '#FBBF24' : '#B45309',
    };
  }

  if (key === 'trialing') {
    return {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(14, 165, 233, 0.12)',
      borderColor: isDark ? 'rgba(56, 189, 248, 0.42)' : 'rgba(2, 132, 199, 0.28)',
      color: isDark ? '#7DD3FC' : '#0369A1',
    };
  }

  if (key === 'canceled' || key === 'paused' || key === 'incomplete') {
    return {
      backgroundColor: isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(148, 163, 184, 0.14)',
      borderColor: isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.28)',
      color: colors.textMuted,
    };
  }

  // active (default)
  return {
    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.16)' : 'rgba(34, 197, 94, 0.12)',
    borderColor: isDark ? 'rgba(34, 197, 94, 0.42)' : 'rgba(22, 163, 74, 0.32)',
    color: isDark ? '#86EFAC' : '#15803D',
  };
}
