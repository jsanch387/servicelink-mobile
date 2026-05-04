import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

const PRO_CROWN_COLOR = '#ca8a04';
/** Trial price label — high-contrast green on dark shells (account subscription row). */
const FREE_TRIAL_LABEL_COLOR = '#4ade80';

export function AccountSubscriptionCard({
  planLabel,
  headerBadge,
  priceDisplay,
  accessLine,
  showProCrown,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: { gap: 14 },
        cardHeaderRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          minHeight: 24,
        },
        cardTitle: {
          color: colors.text,
          flex: 1,
          fontSize: 16,
          fontWeight: '700',
          letterSpacing: -0.2,
        },
        badge: {
          backgroundColor: colors.buttonSecondaryBg,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
        badgeText: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
        },
        planInner: {
          backgroundColor: colors.inputBg,
          borderColor: colors.border,
          borderRadius: 12,
          borderWidth: 1,
          gap: 10,
          paddingHorizontal: 14,
          paddingVertical: 14,
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
          gap: 6,
        },
        planName: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.2,
        },
        priceRow: {
          alignItems: 'baseline',
          flexDirection: 'row',
          gap: 2,
        },
        priceMain: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '700',
        },
        pricePeriod: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
        },
        priceMainFreeTrial: {
          color: FREE_TRIAL_LABEL_COLOR,
        },
        accessHint: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
        },
      }),
    [colors],
  );

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <AppText style={styles.cardTitle}>Subscription plan</AppText>
        {headerBadge ? (
          <View style={styles.badge}>
            <AppText style={styles.badgeText}>{headerBadge}</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.planInner}>
        <View style={[styles.planTierRow, !priceDisplay && styles.planTierRowSingle]}>
          <View style={styles.planNameRow}>
            <AppText style={styles.planName}>{planLabel}</AppText>
            {showProCrown ? (
              <MaterialCommunityIcons
                accessibilityLabel="Pro plan"
                color={PRO_CROWN_COLOR}
                name="crown-outline"
                size={18}
              />
            ) : null}
          </View>
          {priceDisplay ? (
            <View style={styles.priceRow}>
              <AppText
                style={[
                  styles.priceMain,
                  priceDisplay.isFreeTrial ? styles.priceMainFreeTrial : null,
                ]}
              >
                {priceDisplay.primary}
              </AppText>
              {priceDisplay.period ? (
                <AppText style={styles.pricePeriod}>{priceDisplay.period}</AppText>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>

      {accessLine ? <AppText style={styles.accessHint}>{accessLine}</AppText> : null}

      <Button fullWidth title="Manage subscription" variant="secondary" onPress={() => {}} />
    </SurfaceCard>
  );
}
