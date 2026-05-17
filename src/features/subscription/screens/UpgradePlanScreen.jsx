import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, ProCrownIcon, SurfaceCard } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { getSubscriptionAccessLine } from '../../more/utils/subscriptionPresentation';
import { PRO_PLAN_DISPLAY } from '../constants/planComparison';
import { PlanComparisonCard } from '../components/PlanComparisonCard';
import { useSubscription } from '../context/SubscriptionContext';
import { useProUpgradeCheckout } from '../hooks/useProUpgradeCheckout';
import { navigateToAccountSettings } from '../navigation/navigateToAccountSettings';

/**
 * @param {{
 *   colors: import('../../../theme/themes').ThemeColors;
 *   isCurrent: boolean;
 *   isProTier: boolean;
 *   planName: string;
 *   pricePrimary: string;
 *   pricePeriod: string;
 *   priceCompare?: string | null;
 * }} props
 */
function PlanTierCard({
  colors,
  isCurrent,
  isProTier,
  planName,
  pricePrimary,
  pricePeriod,
  priceCompare = null,
}) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.cardSurface,
          borderColor: isCurrent
            ? isProTier
              ? 'rgba(52, 211, 153, 0.55)'
              : colors.borderStrong
            : colors.cardBorder,
          borderRadius: 16,
          borderWidth: isCurrent ? 1.5 : StyleSheet.hairlineWidth,
          flex: 1,
          gap: 10,
          minWidth: 0,
          paddingHorizontal: 14,
          paddingVertical: 16,
        },
        headerRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'space-between',
        },
        planName: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 18,
          fontWeight: '600',
          letterSpacing: -0.35,
        },
        currentPill: {
          backgroundColor: isProTier ? 'rgba(52, 211, 153, 0.16)' : colors.inputBg,
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        currentPillText: {
          color: isProTier ? colors.textSuccess : colors.textMuted,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        },
        priceRow: {
          alignItems: 'baseline',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 4,
        },
        pricePrimary: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 28,
          fontWeight: '700',
          letterSpacing: -0.8,
        },
        pricePeriod: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '600',
        },
        priceCompare: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          textDecorationLine: 'line-through',
        },
      }),
    [colors, isCurrent, isProTier],
  );

  return (
    <SurfaceCard outlined={false} padding="none" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
          {isProTier ? <ProCrownIcon accessibilityLabel="Pro" color="#fbbf24" size={18} /> : null}
          <AppText style={styles.planName}>{planName}</AppText>
        </View>
        {isCurrent ? (
          <View style={styles.currentPill}>
            <AppText style={styles.currentPillText}>Current</AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.priceRow}>
        <AppText style={styles.pricePrimary}>{pricePrimary}</AppText>
        {pricePeriod ? <AppText style={styles.pricePeriod}>{pricePeriod}</AppText> : null}
      </View>
      {priceCompare ? <AppText style={styles.priceCompare}>{priceCompare}</AppText> : null}
    </SurfaceCard>
  );
}

export function UpgradePlanScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { hasProAccess, ownerProfile } = useSubscription();
  const { startUpgradeCheckout, submitting } = useProUpgradeCheckout();

  const accessLine = getSubscriptionAccessLine(ownerProfile);
  const isOnPro = hasProAccess;

  const upgradeButtonIcon = useMemo(
    () => (
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <ProCrownIcon color={colors.buttonPrimaryText} size={20} />
      </View>
    ),
    [colors.buttonPrimaryText],
  );

  const handleManageOnAccount = useCallback(() => {
    navigateToAccountSettings();
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        scroll: {
          paddingBottom: Math.max(insets.bottom + 24, 32),
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 8,
        },
        intro: {
          gap: 8,
          marginBottom: 20,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 26,
          fontWeight: '700',
          letterSpacing: -0.6,
          lineHeight: 32,
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
        },
        accessLine: {
          color: colors.textSuccess,
          fontSize: 14,
          fontWeight: '600',
          marginTop: 2,
        },
        tierRow: {
          flexDirection: 'row',
          gap: 12,
          marginBottom: 24,
        },
        sectionTitle: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 17,
          fontWeight: '600',
          letterSpacing: -0.25,
          marginBottom: 12,
        },
        comparisonWrap: {
          marginBottom: 24,
        },
        proRibbon: {
          alignItems: 'center',
          backgroundColor: 'rgba(52, 211, 153, 0.12)',
          borderColor: 'rgba(52, 211, 153, 0.28)',
          borderRadius: 12,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
          marginBottom: 16,
          paddingHorizontal: 14,
          paddingVertical: 10,
        },
        proRibbonText: {
          color: colors.textSuccess,
          fontSize: 13,
          fontWeight: '700',
        },
        ctaBlock: {
          gap: 12,
        },
        footnote: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          textAlign: 'center',
        },
      }),
    [colors, insets.bottom],
  );

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <AppText accessibilityRole="header" style={styles.title}>
            {isOnPro ? 'Your Pro plan' : 'Upgrade to Pro'}
          </AppText>
          <AppText style={styles.subtitle}>
            {isOnPro
              ? 'You have full access to every ServiceLink tool.'
              : 'Upgrade your plan to unlock more features and full control.'}
          </AppText>
          {accessLine ? <AppText style={styles.accessLine}>{accessLine}</AppText> : null}
        </View>

        {!isOnPro ? (
          <View style={styles.proRibbon}>
            <Ionicons color={colors.textSuccess} name="pricetag" size={16} />
            <AppText style={styles.proRibbonText}>{PRO_PLAN_DISPLAY.ribbon}</AppText>
          </View>
        ) : null}

        <View style={styles.tierRow}>
          <PlanTierCard
            colors={colors}
            isCurrent={!isOnPro}
            isProTier={false}
            planName="Free"
            pricePeriod=""
            pricePrimary="$0"
          />
          <PlanTierCard
            colors={colors}
            isCurrent={isOnPro}
            isProTier
            planName="Pro"
            priceCompare={!isOnPro ? PRO_PLAN_DISPLAY.compareAt : null}
            pricePeriod={PRO_PLAN_DISPLAY.period}
            pricePrimary={PRO_PLAN_DISPLAY.primary}
          />
        </View>

        <AppText style={styles.sectionTitle}>What you get</AppText>
        <View style={styles.comparisonWrap}>
          <PlanComparisonCard colors={colors} />
        </View>

        <View style={styles.ctaBlock}>
          {isOnPro ? (
            <Button
              fullWidth
              title="Manage subscription"
              variant="secondary"
              onPress={handleManageOnAccount}
            />
          ) : (
            <>
              <Button
                fullWidth
                iconNode={upgradeButtonIcon}
                loading={submitting}
                title="Upgrade to Pro"
                variant="primary"
                onPress={() => void startUpgradeCheckout()}
              />
              <AppText style={styles.footnote}>Cancel anytime from your account.</AppText>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
