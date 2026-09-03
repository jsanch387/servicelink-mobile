/**
 * @param {string} status
 * @returns {string}
 */
function iconForQuoteStatus(status) {
  switch (status) {
    case 'requested':
      return 'mail-unread';
    case 'draft':
      return 'create';
    case 'sent':
      return 'time';
    case 'viewed':
      return 'eye';
    case 'approved':
      return 'checkmark-circle';
    case 'declined':
    case 'cancelled':
      return 'close-circle';
    case 'expired':
      return 'hourglass';
    default:
      return 'ellipse';
  }
}

/**
 * Pill colors for quote status — shared by sent-quote list cards and detail proposal pill.
 *
 * @param {string | undefined} statusRaw DB `quotes.status`
 * @param {{ borderStrong: string; border: string; danger: string; text: string; textMuted: string; textSecondary: string }} colors
 * @param {boolean} isDark
 * @returns {{ backgroundColor: string; borderColor: string; color: string; iconName: string }}
 */
export function getQuoteStatusPillTheme(statusRaw, colors, isDark) {
  const s = String(statusRaw ?? '').toLowerCase();
  const iconName = iconForQuoteStatus(s);

  const muted = {
    backgroundColor: isDark ? 'rgba(250,250,250,0.06)' : 'rgba(10,10,10,0.05)',
    borderColor: colors.borderStrong,
    color: colors.textSecondary,
    iconName,
  };

  if (s === 'requested') {
    return {
      backgroundColor: isDark ? 'rgba(251,146,60,0.14)' : 'rgba(234,88,12,0.1)',
      borderColor: isDark ? 'rgba(253,186,116,0.45)' : 'rgba(234,88,12,0.28)',
      color: isDark ? '#fdba74' : '#c2410c',
      iconName,
    };
  }
  /** Orange means the owner owes an action; blue means the ball is with the customer. */
  if (s === 'sent') {
    return {
      backgroundColor: isDark ? 'rgba(96,165,250,0.14)' : 'rgba(37,99,235,0.1)',
      borderColor: isDark ? 'rgba(147,197,253,0.45)' : 'rgba(37,99,235,0.28)',
      color: isDark ? '#93c5fd' : '#1d4ed8',
      iconName,
    };
  }
  if (s === 'viewed') {
    return {
      backgroundColor: isDark ? 'rgba(250,250,250,0.08)' : 'rgba(10,10,10,0.06)',
      borderColor: colors.borderStrong,
      color: colors.text,
      iconName,
    };
  }
  if (s === 'approved') {
    return {
      backgroundColor: isDark ? 'rgba(34,197,94,0.16)' : 'rgba(22,163,74,0.12)',
      borderColor: isDark ? 'rgba(74,222,128,0.45)' : 'rgba(22,163,74,0.28)',
      color: isDark ? '#86efac' : '#15803d',
      iconName,
    };
  }
  if (s === 'declined' || s === 'cancelled') {
    return {
      backgroundColor: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.1)',
      borderColor: isDark ? 'rgba(252,165,165,0.4)' : 'rgba(220,38,38,0.25)',
      color: colors.danger,
      iconName,
    };
  }
  if (s === 'expired') {
    return {
      ...muted,
      color: colors.textMuted,
    };
  }
  if (s === 'draft') {
    return {
      backgroundColor: isDark ? 'rgba(250,250,250,0.05)' : 'rgba(10,10,10,0.04)',
      borderColor: colors.border,
      color: colors.textMuted,
      iconName,
    };
  }

  return muted;
}
