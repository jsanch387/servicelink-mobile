import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { getSubscriptionStatusPillTheme } from '../utils/subscriptionStatusPillTheme';

const PILL_LAYOUT = {
  borderRadius: 999,
  borderWidth: 1,
  flexShrink: 0,
  paddingHorizontal: 8,
  paddingVertical: 3,
};

const PILL_TEXT = {
  fontSize: 11,
  fontWeight: '700',
  letterSpacing: -0.05,
};

/**
 * Subscriber list card (CustomerCard-style hierarchy).
 * @param {object} props
 * @param {string} props.customerName
 * @param {string} props.planName
 * @param {string} [props.nextVisitLabel]
 * @param {string} [props.footerLabel]
 * @param {string} props.statusLabel
 * @param {string} [props.statusRaw]
 * @param {() => void} [props.onPress]
 */
export function SubscriptionMemberCard({
  customerName,
  planName,
  nextVisitLabel = '',
  footerLabel = 'Next visit',
  statusLabel,
  statusRaw = '',
  onPress,
}) {
  const { colors, isDark } = useTheme();

  const pillTheme = useMemo(
    () => getSubscriptionStatusPillTheme(statusRaw, colors, isDark),
    [colors, isDark, statusRaw],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        press: {
          borderRadius: 16,
          width: '100%',
        },
        card: {
          marginBottom: 0,
          paddingHorizontal: 14,
          paddingVertical: 14,
          width: '100%',
        },
        topRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
          width: '100%',
        },
        name: {
          color: colors.text,
          flex: 1,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          letterSpacing: -0.2,
          minWidth: 0,
        },
        statusPill: {
          ...PILL_LAYOUT,
        },
        statusText: {
          ...PILL_TEXT,
        },
        planName: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
          marginTop: 8,
        },
        footer: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 14,
          width: '100%',
        },
        footerLabel: {
          color: colors.placeholder ?? colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 12,
          fontWeight: '500',
        },
        footerRight: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 6,
        },
        footerValue: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
        },
      }),
    [colors],
  );

  const visitValue = nextVisitLabel || 'Not scheduled';

  const inner = (
    <SurfaceCard outlined padding="none" style={styles.card}>
      <View style={styles.topRow}>
        <AppText numberOfLines={1} style={styles.name}>
          {customerName}
        </AppText>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: pillTheme.backgroundColor,
              borderColor: pillTheme.borderColor,
            },
          ]}
        >
          <AppText style={[styles.statusText, { color: pillTheme.color }]}>{statusLabel}</AppText>
        </View>
      </View>
      <AppText numberOfLines={1} style={styles.planName}>
        {planName}
      </AppText>
      <View style={styles.footer}>
        <AppText style={styles.footerLabel}>{footerLabel}</AppText>
        <View style={styles.footerRight}>
          <AppText style={styles.footerValue}>{visitValue}</AppText>
          {onPress ? <Ionicons color={colors.textMuted} name="chevron-forward" size={18} /> : null}
        </View>
      </View>
    </SurfaceCard>
  );

  if (!onPress) return inner;

  return (
    <Pressable
      accessibilityHint="Opens subscription detail"
      accessibilityLabel={`Subscription for ${customerName}`}
      accessibilityRole="button"
      style={({ pressed }) => [styles.press, pressed && { opacity: 0.92 }]}
      onPress={onPress}
    >
      {inner}
    </Pressable>
  );
}
