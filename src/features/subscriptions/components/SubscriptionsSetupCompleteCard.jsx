import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, SuccessMoment, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  formatCadencePillLabel,
  formatCustomCadenceLabel,
  formatPlanPriceCents,
  sortSchedules,
} from '../constants/planCadence';

const DESCRIPTION_COLLAPSE_CHARS = 110;

function previewCadenceLabel(count, interval) {
  const pill = formatCadencePillLabel(count, interval);
  if (pill === '2 weeks') return 'Every 2 weeks';
  if (pill === 'Weekly' || pill === 'Monthly') return pill;
  return formatCustomCadenceLabel(count, interval);
}

function PlanDescription({ text }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const truncatable = text.length > DESCRIPTION_COLLAPSE_CHARS;

  useEffect(() => {
    setExpanded(false);
  }, [text]);

  const display = useMemo(() => {
    if (!truncatable || expanded) return text;
    return `${text.slice(0, DESCRIPTION_COLLAPSE_CHARS).trimEnd()}…`;
  }, [expanded, text, truncatable]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        description: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
        },
        toggle: {
          alignSelf: 'flex-start',
          marginTop: 4,
        },
        toggleText: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          letterSpacing: -0.05,
          textDecorationLine: 'underline',
        },
      }),
    [colors],
  );

  return (
    <View>
      <AppText style={styles.description}>{display}</AppText>
      {truncatable ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 8 }}
          onPress={() => setExpanded((open) => !open)}
          style={styles.toggle}
        >
          <AppText style={styles.toggleText}>{expanded ? 'See less' : 'See more'}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Plan preview on success — name + price on top, cadence pills below.
 * @param {object} props
 * @param {{
 *   name: string;
 *   description?: string;
 *   offeredSchedules?: Array<{
 *     cadenceKey?: string;
 *     count?: number;
 *     interval?: string;
 *     priceCents: number;
 *   }>;
 * }} props.plan
 */
function PlanBookingPreviewCard({ plan }) {
  const { colors, isDark } = useTheme();
  const schedules = useMemo(() => sortSchedules(plan?.offeredSchedules), [plan?.offeredSchedules]);
  const [selectedKey, setSelectedKey] = useState(() => schedules[0]?.cadenceKey ?? null);

  const selected = schedules.find((row) => row.cadenceKey === selectedKey) ?? schedules[0] ?? null;

  const priceSuffix = useMemo(() => {
    if (!selected) return '';
    const count = Number(selected.count) || 1;
    if (selected.interval === 'month' && count === 1) return '/mo';
    if (selected.interval === 'week' && count === 1) return '/wk';
    return '';
  }, [selected]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 16,
          width: '100%',
        },
        topRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'space-between',
        },
        planName: {
          color: colors.text,
          flex: 1,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.3,
          lineHeight: 24,
          minWidth: 0,
        },
        priceRow: {
          alignItems: 'baseline',
          flexDirection: 'row',
          flexShrink: 0,
          marginTop: 1,
        },
        price: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.3,
        },
        priceSuffix: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
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
        pillSelected: {
          backgroundColor: isDark ? '#fafafa' : colors.text,
          borderColor: isDark ? '#fafafa' : colors.text,
        },
        pillText: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 11,
          letterSpacing: -0.05,
        },
        pillTextSelected: {
          color: isDark ? '#0a0a0a' : colors.shell,
        },
      }),
    [colors, isDark],
  );

  const description = String(plan?.description ?? '').trim();

  return (
    <SurfaceCard outlined padding="none" style={styles.card}>
      <View style={styles.topRow}>
        <AppText numberOfLines={2} style={styles.planName}>
          {plan?.name || 'Plan'}
        </AppText>
        {selected ? (
          <View style={styles.priceRow}>
            <AppText style={styles.price}>{formatPlanPriceCents(selected.priceCents)}</AppText>
            {priceSuffix ? <AppText style={styles.priceSuffix}>{priceSuffix}</AppText> : null}
          </View>
        ) : null}
      </View>

      {schedules.length > 0 ? (
        <View style={styles.pillsRow}>
          {schedules.map((row) => {
            const active = row.cadenceKey === (selected?.cadenceKey ?? null);
            return (
              <Pressable
                key={row.cadenceKey}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedKey(row.cadenceKey)}
                style={[styles.pill, active ? styles.pillSelected : null]}
              >
                <AppText style={[styles.pillText, active ? styles.pillTextSelected : null]}>
                  {previewCadenceLabel(row.count, row.interval)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {description ? <PlanDescription text={description} /> : null}
    </SurfaceCard>
  );
}

/**
 * Centered success after the first plan is saved — animated check + plan preview.
 *
 * @param {object} props
 * @param {object} props.plan
 * @param {() => void} props.onContinue
 */
export function SubscriptionsSetupCompleteCard({ plan, onContinue }) {
  const replayKey = plan?.id ?? plan?.name ?? 'plan-ready';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flexGrow: 1,
          justifyContent: 'center',
          paddingBottom: 8,
          width: '100%',
        },
        previewWrap: {
          marginTop: 18,
          width: '100%',
        },
        doneWrap: {
          marginTop: 28,
          width: '100%',
        },
      }),
    [],
  );

  return (
    <View style={styles.root}>
      <SuccessMoment
        centered
        iconAccessibilityLabel="Plan ready"
        replayKey={replayKey}
        title="Your plan is ready"
        variant="inline"
      >
        <View style={styles.previewWrap}>
          <PlanBookingPreviewCard plan={plan} />
        </View>
        <View style={styles.doneWrap}>
          <Button
            fullWidth
            labelColor="#0b0c0f"
            title="Done"
            variant="surfaceLight"
            onPress={onContinue}
          />
        </View>
      </SuccessMoment>
    </View>
  );
}
