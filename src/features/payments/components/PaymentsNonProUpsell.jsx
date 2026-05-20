import { useCallback, useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { AppText, Button, Divider, SurfaceCard } from '../../../components/ui';
import { getWebAccountAdminUrl } from '../../../lib/webAppOrigin';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  PAYMENTS_WEB_ACCESS_CTA,
  PAYMENTS_WEB_ACCESS_SUBTITLE,
  PAYMENTS_WEB_ACCESS_TITLE,
} from '../constants/paymentsAccessCopy';

const BENEFITS = [
  { lead: 'Get paid to your bank', rest: 'Set it up once; money goes straight to your account.' },
  { lead: 'Cards & deposits', rest: 'Let clients pay online when they book you.' },
  { lead: 'You choose how they pay', rest: 'Pick the options that fit your business.' },
];

/**
 * Payments require expanded access — set up on web (App Store–safe; no in-app upgrade CTA).
 */
export function PaymentsNonProUpsell() {
  const { colors } = useTheme();

  const handleSignInOnWeb = useCallback(() => {
    void Linking.openURL(getWebAccountAdminUrl());
  }, []);

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
          fontSize: 22,
          fontFamily: FONT_FAMILIES.semibold,
          fontWeight: '600',
          letterSpacing: -0.45,
          lineHeight: 28,
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
          marginTop: 20,
          textTransform: 'uppercase',
        },
        list: {
          marginTop: 10,
          marginBottom: 2,
        },
        benefitRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 13,
          paddingVertical: 12,
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
          marginTop: 6,
        },
        ctaWrap: {
          marginTop: 18,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root} testID="payments-non-pro-upsell">
      <SurfaceCard outlined padding="md" style={styles.card}>
        <View style={styles.headerBlock}>
          <AppText accessibilityRole="header" style={styles.title}>
            {PAYMENTS_WEB_ACCESS_TITLE}
          </AppText>
          <AppText style={styles.subtitle}>{PAYMENTS_WEB_ACCESS_SUBTITLE}</AppText>
        </View>

        <AppText style={styles.sectionLabel}>What you can set up</AppText>

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
            title={PAYMENTS_WEB_ACCESS_CTA}
            variant="secondary"
            onPress={handleSignInOnWeb}
          />
        </View>
      </SurfaceCard>
    </View>
  );
}
