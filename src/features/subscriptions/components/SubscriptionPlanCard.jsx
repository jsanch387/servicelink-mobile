import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  formatCadencePillLabel,
  formatCustomCadenceLabel,
  formatPlanPriceCents,
  lowestSchedulePriceCents,
  sortSchedules,
} from '../constants/planCadence';

function hubCadencePillLabel(schedule) {
  if (schedule?.label) return schedule.label;
  const count = Number(schedule?.count) || 1;
  const interval = schedule?.interval;
  if (interval === 'year' && count === 1) return 'Yearly';
  const pill = formatCadencePillLabel(count, interval);
  if (pill === 'Weekly' || pill === 'Biweekly' || pill === 'Monthly') return pill;
  return formatCustomCadenceLabel(count, interval);
}

function priceSuffixForSchedule(schedule) {
  if (!schedule) return '';
  const count = Number(schedule.count) || 1;
  if (schedule.interval === 'month' && count === 1) return '/mo';
  if (schedule.interval === 'week' && count === 1) return '/wk';
  if (schedule.interval === 'year' && count === 1) return '/yr';
  return '';
}

/**
 * Hub plan card — name + price, small cadence pills, members footer + chevron.
 * @param {object} props
 * @param {{
 *   id: string;
 *   name: string;
 *   offeredSchedules?: Array<{
 *     cadenceKey?: string;
 *     count?: number;
 *     interval?: string;
 *     priceCents?: number;
 *   }>;
 *   subscriberCount?: number;
 * }} props.plan
 * @param {() => void} [props.onPress]
 */
export function SubscriptionPlanCard({ plan, onPress }) {
  const { colors, isDark } = useTheme();
  const schedules = useMemo(() => sortSchedules(plan?.offeredSchedules), [plan?.offeredSchedules]);
  const lowestCents = lowestSchedulePriceCents(schedules);
  const priceSchedule =
    schedules.find((row) => Number(row.priceCents) === lowestCents) ?? schedules[0] ?? null;
  const priceSuffix = priceSuffixForSchedule(priceSchedule);
  const subscriberCount = Number(plan?.subscriberCount);
  const subscriberLabel =
    Number.isFinite(subscriberCount) && subscriberCount > 0
      ? `${subscriberCount} subscriber${subscriberCount === 1 ? '' : 's'}`
      : 'No subscribers yet';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        press: {
          borderRadius: 16,
          width: '100%',
        },
        card: {
          gap: 10,
          marginBottom: 0,
          paddingHorizontal: 16,
          paddingVertical: 14,
          width: '100%',
        },
        topRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'space-between',
        },
        name: {
          color: colors.text,
          flex: 1,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.3,
          lineHeight: 22,
          minWidth: 0,
        },
        priceRow: {
          alignItems: 'baseline',
          flexDirection: 'row',
          flexShrink: 0,
          marginTop: 1,
        },
        priceAmount: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.25,
        },
        priceSuffix: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 12,
          fontWeight: '500',
        },
        pillsRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 6,
        },
        pill: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.shellElevated,
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
          borderRadius: 999,
          borderWidth: 1,
          paddingHorizontal: 9,
          paddingVertical: 4,
        },
        pillText: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 11,
          letterSpacing: -0.05,
        },
        footer: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          marginTop: 2,
        },
        footerLabel: {
          color: colors.textMuted,
          flex: 1,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
          minWidth: 0,
        },
      }),
    [colors, isDark],
  );

  const inner = (
    <SurfaceCard outlined padding="none" style={styles.card}>
      <View style={styles.topRow}>
        <AppText numberOfLines={2} style={styles.name}>
          {plan.name}
        </AppText>
        {lowestCents != null ? (
          <View style={styles.priceRow}>
            <AppText style={styles.priceAmount}>{formatPlanPriceCents(lowestCents)}</AppText>
            {priceSuffix ? <AppText style={styles.priceSuffix}>{priceSuffix}</AppText> : null}
          </View>
        ) : null}
      </View>

      {schedules.length > 0 ? (
        <View style={styles.pillsRow}>
          {schedules.map((row) => (
            <View key={row.cadenceKey} style={styles.pill}>
              <AppText style={styles.pillText}>{hubCadencePillLabel(row)}</AppText>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.footer}>
        <AppText numberOfLines={1} style={styles.footerLabel}>
          {subscriberLabel}
        </AppText>
        {onPress ? <Ionicons color={colors.textMuted} name="chevron-forward" size={18} /> : null}
      </View>
    </SurfaceCard>
  );

  if (!onPress) return inner;

  return (
    <TouchableOpacity
      accessibilityHint="Opens subscription details"
      accessibilityLabel={`Subscription ${plan.name}`}
      accessibilityRole="button"
      activeOpacity={0.92}
      style={styles.press}
      onPress={onPress}
    >
      {inner}
    </TouchableOpacity>
  );
}
