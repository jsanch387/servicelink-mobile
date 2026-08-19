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

/**
 * Subscriber row — name + status; cadence under name; plan + chevron on bottom row.
 *
 * @param {object} props
 * @param {string} props.customerName
 * @param {string} [props.cadenceLabel]
 * @param {string} [props.planName]
 * @param {string} props.statusLabel
 * @param {string} [props.statusRaw]
 * @param {() => void} [props.onPress]
 */
export function SubscriptionMemberCard({
  customerName,
  cadenceLabel = '',
  planName = '',
  statusLabel,
  statusRaw = '',
  onPress,
}) {
  const { colors, isDark } = useTheme();

  const pillTheme = useMemo(
    () => getSubscriptionStatusPillTheme(statusRaw, colors, isDark),
    [colors, isDark, statusRaw],
  );

  const cadenceTrim = String(cadenceLabel ?? '').trim();
  const planTrim = String(planName ?? '').trim();

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
        nameCol: {
          flex: 1,
          minWidth: 0,
          justifyContent: 'center',
        },
        name: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          letterSpacing: -0.2,
        },
        cadence: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: -0.1,
          marginTop: 3,
        },
        statusPill: {
          ...PILL_LAYOUT,
        },
        statusText: {
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: -0.05,
        },
        bottomRow: {
          alignItems: 'center',
          flexDirection: 'row',
          marginTop: 12,
          width: '100%',
        },
        planCol: {
          flex: 1,
          minWidth: 0,
          justifyContent: 'center',
        },
        plan: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
        },
        chevronCol: {
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
        },
      }),
    [colors],
  );

  const body = (
    <SurfaceCard outlined padding="none" style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.nameCol}>
          <AppText numberOfLines={1} style={styles.name}>
            {customerName}
          </AppText>
        </View>
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

      {cadenceTrim ? (
        <AppText numberOfLines={1} style={styles.cadence}>
          {cadenceTrim}
        </AppText>
      ) : null}

      <View style={styles.bottomRow}>
        <View style={styles.planCol}>
          {planTrim ? (
            <AppText numberOfLines={1} style={styles.plan}>
              {planTrim}
            </AppText>
          ) : null}
        </View>
        {onPress ? (
          <View style={styles.chevronCol}>
            <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
          </View>
        ) : null}
      </View>
    </SurfaceCard>
  );

  if (!onPress) return body;

  return (
    <Pressable
      accessibilityHint="Opens subscription detail"
      accessibilityLabel={`Subscription for ${customerName}`}
      accessibilityRole="button"
      onPress={onPress}
    >
      {({ pressed }) => <View style={[styles.press, pressed && { opacity: 0.92 }]}>{body}</View>}
    </Pressable>
  );
}
