import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  ProCrownIcon,
  PRO_CROWN_COLOR_ACCOUNT,
  SurfaceCard,
} from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

const FREE_PLAN_PITCH = 'Upgrade to Pro for unlimited bookings and every tool.';

/**
 * @param {{
 *   planLabel: string;
 *   priceDisplay: { primary: string; period: string; isFreeTrial?: boolean } | null;
 *   accessLine: string | null;
 *   showProCrown: boolean;
 *   manageSubscriptionLoading?: boolean;
 *   onManageSubscriptionPress?: () => void;
 * }} props
 */
export function AccountSubscriptionCard({
  planLabel,
  priceDisplay,
  accessLine,
  showProCrown,
  manageSubscriptionLoading = false,
  onManageSubscriptionPress,
}) {
  const { colors } = useTheme();
  const isPro = showProCrown;

  const upgradeIcon = useMemo(
    () => (
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <ProCrownIcon color={colors.buttonPrimaryText} size={18} />
      </View>
    ),
    [colors.buttonPrimaryText],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          gap: 0,
        },
        planInner: {
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        planTierRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        planTierRowSingle: {
          justifyContent: 'flex-start',
        },
        planNameRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
        },
        planName: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 20,
          fontWeight: '600',
          letterSpacing: -0.35,
          lineHeight: 26,
          textAlign: 'left',
        },
        priceRow: {
          alignItems: 'baseline',
          flexDirection: 'row',
          flexShrink: 0,
          gap: 3,
        },
        priceMain: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 17,
          fontWeight: '500',
          letterSpacing: -0.2,
          textAlign: 'right',
        },
        priceMainTrial: {
          color: colors.textSuccess,
        },
        pricePeriod: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          textAlign: 'right',
        },
        freePitch: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 20,
        },
        accessHint: {
          alignSelf: 'stretch',
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.05,
          lineHeight: 18,
          marginTop: 2,
        },
        cta: {
          marginTop: 20,
        },
      }),
    [colors],
  );

  return (
    <SurfaceCard outlined padding="md" style={styles.card}>
      <View style={styles.planInner}>
        <View style={[styles.planTierRow, !priceDisplay && styles.planTierRowSingle]}>
          <View style={styles.planNameRow}>
            <AppText style={styles.planName}>{planLabel}</AppText>
            {isPro ? (
              <ProCrownIcon
                accessibilityLabel="Pro plan"
                color={PRO_CROWN_COLOR_ACCOUNT}
                size={20}
              />
            ) : null}
          </View>
          {priceDisplay ? (
            <View style={styles.priceRow}>
              <AppText
                style={[styles.priceMain, priceDisplay.isFreeTrial ? styles.priceMainTrial : null]}
              >
                {priceDisplay.primary}
              </AppText>
              {priceDisplay.period ? (
                <AppText style={styles.pricePeriod}>{priceDisplay.period}</AppText>
              ) : null}
            </View>
          ) : null}
        </View>
        {!isPro ? <AppText style={styles.freePitch}>{FREE_PLAN_PITCH}</AppText> : null}
        {accessLine ? <AppText style={styles.accessHint}>{accessLine}</AppText> : null}
      </View>

      <Button
        fullWidth
        iconNode={isPro ? null : upgradeIcon}
        iconPosition="left"
        loading={manageSubscriptionLoading}
        style={styles.cta}
        title={isPro ? 'Manage subscription' : 'Upgrade to Pro'}
        variant={isPro ? 'secondary' : 'primary'}
        onPress={onManageSubscriptionPress ?? (() => {})}
      />
    </SurfaceCard>
  );
}
