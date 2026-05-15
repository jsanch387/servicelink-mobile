import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Divider, ProCrownIcon, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

/** Lead + detail — plain language, no product jargon. */
const BENEFITS = [
  { lead: 'Get paid to your bank', rest: 'Set it up once; money goes straight to your account.' },
  { lead: 'Cards & deposits', rest: 'Let clients pay online when they book you.' },
  { lead: 'You choose how they pay', rest: 'Pick the options that fit your business.' },
];

/**
 * Payments requires **Pro**. Parent sends the user to **Account** to upgrade or manage their plan.
 */
export function PaymentsNonProUpsell({ onUpgradePress }) {
  const { colors } = useTheme();

  const upgradeIcon = useMemo(
    () => (
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <ProCrownIcon color={colors.buttonPrimaryText} size={19} />
      </View>
    ),
    [colors.buttonPrimaryText],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignSelf: 'stretch',
        },
        card: {
          gap: 0,
        },
        headerBlock: {
          gap: 10,
          marginBottom: 2,
        },
        title: {
          color: colors.text,
          fontSize: 23,
          fontFamily: FONT_FAMILIES.semibold,
          fontWeight: '600',
          letterSpacing: -0.5,
          lineHeight: 29,
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 15,
          fontFamily: FONT_FAMILIES.medium,
          fontWeight: '500',
          lineHeight: 22,
        },
        sectionLabel: {
          color: colors.textMuted,
          fontSize: 11,
          fontFamily: FONT_FAMILIES.semibold,
          fontWeight: '600',
          letterSpacing: 1.35,
          marginTop: 22,
          textTransform: 'uppercase',
        },
        list: {
          marginTop: 12,
          marginBottom: 2,
        },
        benefitRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 13,
          paddingVertical: 13,
        },
        marker: {
          backgroundColor: colors.text,
          borderRadius: 100,
          height: 6,
          marginTop: 7,
          opacity: 0.2,
          width: 6,
        },
        benefitTextCol: {
          flex: 1,
        },
        benefitLead: {
          color: colors.text,
          fontSize: 15,
          fontFamily: FONT_FAMILIES.semibold,
          fontWeight: '600',
          lineHeight: 22,
        },
        benefitRest: {
          color: colors.textMuted,
          fontSize: 15,
          fontFamily: FONT_FAMILIES.medium,
          fontWeight: '500',
          lineHeight: 22,
        },
        ruleBeforeCta: {
          marginBottom: 2,
          marginTop: 8,
        },
        ctaWrap: {
          marginTop: 20,
        },
        foot: {
          color: colors.textMuted,
          fontSize: 12,
          fontFamily: FONT_FAMILIES.medium,
          fontWeight: '500',
          lineHeight: 17,
          marginTop: 16,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root} testID="payments-non-pro-upsell">
      <SurfaceCard outlined padding="md" style={styles.card}>
        <View style={styles.headerBlock}>
          <AppText accessibilityRole="header" style={styles.title}>
            Take payments with Pro
          </AppText>
          <AppText style={styles.subtitle}>
            One upgrade—accept cards, offer deposits, and manage it all from this tab.
          </AppText>
        </View>

        <AppText style={styles.sectionLabel}>What you get</AppText>

        <View style={styles.list}>
          {BENEFITS.map(({ lead, rest }, index) => (
            <View key={`benefit-${lead}`}>
              {index > 0 ? <Divider /> : null}
              <View style={styles.benefitRow}>
                <View style={styles.marker} />
                <View style={styles.benefitTextCol}>
                  <AppText>
                    <AppText style={styles.benefitLead}>{lead}</AppText>
                    {'  '}
                    <AppText style={styles.benefitRest}>{rest}</AppText>
                  </AppText>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Divider style={styles.ruleBeforeCta} />

        <View style={styles.ctaWrap}>
          <Button
            fullWidth
            iconNode={upgradeIcon}
            iconPosition="left"
            title="Upgrade to Pro"
            variant="primary"
            onPress={onUpgradePress}
          />
        </View>

        <AppText style={styles.foot}>
          Secure card processing with Stripe · Cancel anytime in Account
        </AppText>
      </SurfaceCard>
    </View>
  );
}
