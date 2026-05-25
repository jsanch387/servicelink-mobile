/**
 * @param {string | undefined} statusRaw
 * @param {{ borderStrong: string; border: string; danger: string; text: string; textMuted: string; textSecondary: string }} colors
 * @param {boolean} isDark
 */
export function getMaintenanceStatusPillTheme(statusRaw, colors, isDark) {
  const s = String(statusRaw ?? '').toLowerCase();

  const muted = {
    backgroundColor: isDark ? 'rgba(250,250,250,0.06)' : 'rgba(10,10,10,0.05)',
    borderColor: colors.borderStrong,
    color: colors.textSecondary,
  };

  if (s === 'enrolled_pending_customer') {
    return {
      backgroundColor: isDark ? 'rgba(251,146,60,0.14)' : 'rgba(234,88,12,0.1)',
      borderColor: isDark ? 'rgba(253,186,116,0.45)' : 'rgba(234,88,12,0.28)',
      color: isDark ? '#fdba74' : '#c2410c',
    };
  }
  if (s === 'visit_completed') {
    return {
      backgroundColor: isDark ? 'rgba(37,99,235,0.32)' : 'rgba(125,211,252,0.16)',
      borderColor: isDark ? 'rgba(147,197,253,0.55)' : 'rgba(147,197,253,0.45)',
      color: isDark ? '#7dd3fc' : '#1e40af',
    };
  }
  if (s === 'accepted') {
    return {
      backgroundColor: isDark ? 'rgba(34,197,94,0.16)' : 'rgba(22,163,74,0.12)',
      borderColor: isDark ? 'rgba(74,222,128,0.45)' : 'rgba(22,163,74,0.28)',
      color: isDark ? '#86efac' : '#15803d',
    };
  }
  if (s === 'cancelled') {
    return {
      backgroundColor: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.1)',
      borderColor: isDark ? 'rgba(252,165,165,0.4)' : 'rgba(220,38,38,0.25)',
      color: colors.danger,
    };
  }

  return muted;
}
