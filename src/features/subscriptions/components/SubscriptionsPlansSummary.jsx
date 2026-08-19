import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { formatPlanPriceWithCadence } from '../constants/planCadence';
import { formatPlanPrice } from '../utils/subscriptionPresentation';

/**
 * @param {object} props
 * @param {Array<{
 *   id: string;
 *   name: string;
 *   priceCents: number;
 *   interval?: 'month' | 'year';
 *   cadenceKey?: string;
 * }>} props.plans
 * @param {string} props.publicLink
 * @param {() => void} props.onCopyLink
 * @param {boolean} [props.linkCopied]
 * @param {() => void} [props.onAddPlan]
 */
export function SubscriptionsPlansSummary({
  plans,
  publicLink,
  onCopyLink,
  linkCopied = false,
  onAddPlan,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginBottom: 0,
        },
        titleRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'space-between',
        },
        title: {
          color: colors.text,
          flex: 1,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          letterSpacing: -0.2,
          minWidth: 0,
        },
        addLabel: {
          color: colors.accent,
          flexShrink: 0,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
          letterSpacing: -0.1,
        },
        subtitle: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          marginTop: 4,
        },
        planRow: {
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'space-between',
          marginTop: 12,
          paddingTop: 12,
        },
        planName: {
          color: colors.text,
          flex: 1,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.15,
          minWidth: 0,
        },
        planMeta: {
          color: colors.textSecondary,
          flexShrink: 0,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
        },
        linkRow: {
          alignItems: 'center',
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 12,
          paddingTop: 12,
        },
        linkLabel: {
          color: colors.accent,
          flex: 1,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
          letterSpacing: -0.1,
          minWidth: 0,
        },
        linkHint: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 12,
          fontWeight: '500',
          marginTop: 6,
        },
      }),
    [colors],
  );

  return (
    <SurfaceCard padding="md" style={styles.card}>
      <View style={styles.titleRow}>
        <AppText style={styles.title}>Your subscriptions</AppText>
        {onAddPlan ? (
          <AppText accessibilityRole="button" style={styles.addLabel} onPress={onAddPlan}>
            Add subscription
          </AppText>
        ) : null}
      </View>
      <AppText style={styles.subtitle}>
        Customers subscribe from your public memberships link.
      </AppText>
      {plans.map((plan) => (
        <View key={plan.id} style={styles.planRow}>
          <AppText numberOfLines={1} style={styles.planName}>
            {plan.name}
          </AppText>
          <AppText style={styles.planMeta}>
            {plan.cadenceKey
              ? formatPlanPriceWithCadence(plan.priceCents, plan.cadenceKey)
              : formatPlanPrice(plan.priceCents, plan.interval ?? 'month')}
          </AppText>
        </View>
      ))}
      <View style={styles.linkRow}>
        <AppText
          accessibilityRole="button"
          numberOfLines={1}
          style={styles.linkLabel}
          onPress={onCopyLink}
        >
          {linkCopied ? 'Link copied' : 'Copy memberships link'}
        </AppText>
      </View>
      <AppText numberOfLines={1} style={styles.linkHint}>
        {publicLink.replace(/^https?:\/\//, '')}
      </AppText>
    </SurfaceCard>
  );
}
