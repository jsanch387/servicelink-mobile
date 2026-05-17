import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES } from '../../../theme';
import { PLAN_COMPARISON_FEATURES } from '../constants/planComparison';

/** Fixed pill width so Free / Pro labels align and body text starts on the same edge. */
const TIER_PILL_WIDTH = 52;

/**
 * @param {{
 *   isPro?: boolean;
 *   label: string;
 *   styles: ReturnType<typeof StyleSheet.create>;
 *   text: string;
 *   unavailable?: boolean;
 * }} props
 */
function PlanComparisonTierLine({ isPro = false, label, styles, text, unavailable = false }) {
  return (
    <View style={styles.tierRow}>
      <View style={[styles.tierPill, isPro ? styles.tierPillPro : styles.tierPillFree]}>
        <AppText style={[styles.tierPillLabel, isPro ? styles.tierPillLabelPro : null]}>
          {label}
        </AppText>
      </View>
      <AppText style={[styles.tierText, unavailable ? styles.tierTextMuted : null]}>{text}</AppText>
    </View>
  );
}

/**
 * @param {{
 *   isFirst?: boolean;
 *   row: import('../constants/planComparison').PlanComparisonRow;
 *   styles: ReturnType<typeof StyleSheet.create>;
 * }} props
 */
function PlanComparisonFeatureBlock({ isFirst = false, row, styles }) {
  return (
    <View style={[styles.block, isFirst && styles.blockFirst]}>
      <AppText style={styles.blockTitle}>{row.label}</AppText>
      <View style={styles.blockTiers}>
        <PlanComparisonTierLine
          label="Free"
          styles={styles}
          text={row.free}
          unavailable={row.freeUnavailable === true}
        />
        <PlanComparisonTierLine isPro label="Pro" styles={styles} text={row.pro} />
      </View>
    </View>
  );
}

/**
 * @param {{ colors: import('../../../theme/themes').ThemeColors }} props
 */
export function PlanComparisonCard({ colors }) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.cardBorder,
          borderRadius: 16,
          borderWidth: StyleSheet.hairlineWidth,
          gap: 0,
          overflow: 'hidden',
          paddingVertical: 6,
        },
        block: {
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          gap: 12,
          paddingHorizontal: 18,
          paddingVertical: 18,
        },
        blockFirst: {
          borderTopWidth: 0,
        },
        blockTitle: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.25,
          lineHeight: 22,
        },
        blockTiers: {
          gap: 12,
        },
        tierRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
        },
        tierPill: {
          alignItems: 'center',
          borderRadius: 8,
          justifyContent: 'center',
          minHeight: 28,
          paddingHorizontal: 8,
          paddingVertical: 5,
          width: TIER_PILL_WIDTH,
        },
        tierPillFree: {
          backgroundColor: colors.inputBg,
        },
        tierPillPro: {
          backgroundColor: 'rgba(52, 211, 153, 0.12)',
        },
        tierPillLabel: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.45,
          textAlign: 'center',
          textTransform: 'uppercase',
        },
        tierPillLabelPro: {
          color: colors.textSuccess,
        },
        tierText: {
          color: colors.textSecondary,
          flex: 1,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 21,
          paddingTop: 4,
        },
        tierTextMuted: {
          color: colors.textMuted,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.card}>
      {PLAN_COMPARISON_FEATURES.map((row, index) => (
        <PlanComparisonFeatureBlock
          key={row.label}
          isFirst={index === 0}
          row={row}
          styles={styles}
        />
      ))}
    </View>
  );
}
