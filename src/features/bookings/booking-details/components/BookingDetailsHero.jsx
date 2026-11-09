import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

const PILL = {
  success: {
    dark: { bg: 'rgba(52, 199, 89, 0.16)', text: '#3ddc84', dot: '#34c759' },
    light: { bg: 'rgba(22, 163, 74, 0.12)', text: '#15803d', dot: '#16a34a' },
  },
  danger: {
    dark: { bg: 'rgba(248, 113, 113, 0.16)', text: '#fca5a5', dot: '#f87171' },
    light: { bg: 'rgba(220, 38, 38, 0.12)', text: '#b91c1c', dot: '#dc2626' },
  },
  neutral: {
    dark: { bg: 'rgba(255, 255, 255, 0.08)', text: '#d4d4d4', dot: '#a3a3a3' },
    light: { bg: 'rgba(10, 10, 10, 0.06)', text: '#404040', dot: '#737373' },
  },
};

/**
 * @param {string | null | undefined} status
 * @returns {{ label: string, tone: 'success' | 'danger' | 'neutral' }}
 */
function statusPill(status) {
  const raw = String(status ?? '').trim();
  const lower = raw.toLowerCase();
  if (lower === 'cancelled' || lower === 'canceled') {
    return { label: 'Canceled', tone: 'danger' };
  }
  if (lower === 'completed' || lower === 'complete') {
    return { label: 'Completed', tone: 'success' };
  }
  if (lower === 'confirmed' || !raw) {
    return { label: 'Confirmed', tone: 'success' };
  }
  return {
    label: raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase(),
    tone: 'neutral',
  };
}

/**
 * Date headline, status pill, and time · duration line.
 *
 * @param {object} props
 * @param {string} props.date
 * @param {string} [props.subtitle]
 * @param {string} [props.status]
 */
export function BookingDetailsHero({ date, subtitle = '', status }) {
  const { colors, isDark } = useTheme();
  const pill = statusPill(status);
  const tone = PILL[pill.tone][isDark ? 'dark' : 'light'];
  const subtitleText = String(subtitle ?? '').trim();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        titleRow: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        titleCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        date: {
          color: colors.text,
          fontSize: 28,
          fontWeight: '700',
          letterSpacing: -0.6,
        },
        pill: {
          alignItems: 'center',
          backgroundColor: tone.bg,
          borderRadius: 999,
          flexDirection: 'row',
          flexShrink: 0,
          marginLeft: 12,
          paddingHorizontal: 10,
          paddingVertical: 5,
        },
        dot: {
          backgroundColor: tone.dot,
          borderRadius: 4,
          height: 7,
          marginRight: 6,
          width: 7,
        },
        pillLabel: {
          color: tone.text,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '400',
          letterSpacing: -0.15,
          marginTop: 4,
        },
      }),
    [colors.text, colors.textMuted, tone.bg, tone.dot, tone.text],
  );

  return (
    <View>
      <View style={styles.titleRow}>
        <View style={styles.titleCol}>
          <AppText accessibilityRole="header" style={styles.date}>
            {date}
          </AppText>
        </View>
        <View accessibilityLabel={pill.label} accessible style={styles.pill}>
          <View accessibilityElementsHidden importantForAccessibility="no" style={styles.dot} />
          <AppText
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={styles.pillLabel}
          >
            {pill.label}
          </AppText>
        </View>
      </View>
      {subtitleText ? <AppText style={styles.subtitle}>{subtitleText}</AppText> : null}
    </View>
  );
}
