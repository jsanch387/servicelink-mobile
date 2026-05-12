import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  ProCrownIcon,
  PRO_CROWN_COLOR_ACCOUNT,
  SurfaceCard,
} from '../../../components/ui';
import { useTheme } from '../../../theme';

/** Trial price label — high-contrast green on dark shells (account subscription row). */
const FREE_TRIAL_LABEL_COLOR = '#4ade80';

export function AccountSubscriptionCard({
  planLabel,
  priceDisplay,
  accessLine,
  showProCrown,
  manageSubscriptionLoading = false,
  onManageSubscriptionPress,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: { gap: 14 },
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
          textAlign: 'left',
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
          textAlign: 'left',
        },
        pricePeriod: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          textAlign: 'left',
        },
        priceMainFreeTrial: {
          color: FREE_TRIAL_LABEL_COLOR,
        },
        accessHint: {
          alignSelf: 'stretch',
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          marginTop: 4,
          textAlign: 'left',
        },
      }),
    [colors],
  );

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.planInner}>
        <View style={[styles.planTierRow, !priceDisplay && styles.planTierRowSingle]}>
          <View style={styles.planNameRow}>
            <AppText style={styles.planName}>{planLabel}</AppText>
            {showProCrown ? (
              <ProCrownIcon
                accessibilityLabel="Pro plan"
                color={PRO_CROWN_COLOR_ACCOUNT}
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
        {accessLine ? <AppText style={styles.accessHint}>{accessLine}</AppText> : null}
      </View>

      <Button
        fullWidth
        loading={manageSubscriptionLoading}
        title="Manage subscription"
        variant="secondary"
        onPress={onManageSubscriptionPress ?? (() => {})}
      />
    </SurfaceCard>
  );
}
