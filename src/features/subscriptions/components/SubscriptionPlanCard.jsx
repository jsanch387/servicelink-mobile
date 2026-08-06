import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { formatPlanPriceCents } from '../constants/planCadence';

/**
 * Polished plan snapshot for the Plans hub.
 * @param {object} props
 * @param {{
 *   id: string;
 *   name: string;
 *   priceCents: number;
 *   offeredCadenceKeys?: string[];
 * }} props.plan
 * @param {() => void} [props.onPress]
 */
export function SubscriptionPlanCard({ plan, onPress }) {
  const { colors } = useTheme();
  const optionCount = Array.isArray(plan.offeredCadenceKeys) ? plan.offeredCadenceKeys.length : 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        press: {
          borderRadius: 16,
          width: '100%',
        },
        card: {
          marginBottom: 0,
          paddingHorizontal: 16,
          paddingVertical: 16,
          width: '100%',
        },
        container: {
          position: 'relative',
          width: '100%',
        },
        topRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 14,
          width: '100%',
        },
        iconWrap: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          height: 48,
          justifyContent: 'center',
          width: 48,
        },
        main: {
          flex: 1,
          minWidth: 0,
          paddingRight: 80, // Space for price
        },
        name: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 17,
          letterSpacing: -0.25,
          lineHeight: 22,
        },
        priceContainer: {
          position: 'absolute',
          right: 0,
          top: 0,
        },
        price: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 20,
          letterSpacing: -0.25,
          lineHeight: 24,
          textAlign: 'right',
        },
        meta: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          marginTop: 8,
        },
        chevronContainer: {
          position: 'absolute',
          bottom: 0,
          right: 0,
        },
      }),
    [colors],
  );

  const meta =
    optionCount <= 0
      ? 'Tap for details'
      : optionCount === 1
        ? '1 schedule option'
        : `${optionCount} schedule options`;

  const inner = (
    <SurfaceCard outlined padding="none" style={styles.card}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <View style={styles.iconWrap}>
            <Ionicons color={colors.text} name="layers-outline" size={22} />
          </View>
          <View style={styles.main}>
            <AppText numberOfLines={2} style={styles.name}>
              {plan.name}
            </AppText>
            <AppText style={styles.meta}>{meta}</AppText>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <AppText style={styles.price}>{formatPlanPriceCents(plan.priceCents)}</AppText>
        </View>

        {onPress ? (
          <View style={styles.chevronContainer}>
            <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
          </View>
        ) : null}
      </View>
    </SurfaceCard>
  );

  if (!onPress) return inner;

  return (
    <Pressable
      accessibilityHint="Opens plan details"
      accessibilityLabel={`Plan ${plan.name}`}
      accessibilityRole="button"
      style={({ pressed }) => [styles.press, pressed && { opacity: 0.92 }]}
      onPress={onPress}
    >
      {inner}
    </Pressable>
  );
}
