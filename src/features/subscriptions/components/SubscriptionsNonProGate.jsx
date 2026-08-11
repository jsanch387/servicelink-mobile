import { useCallback, useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { getWebAccountAdminUrl } from '../../../lib/webAppOrigin';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  SUBSCRIPTIONS_NON_PRO_BENEFITS,
  SUBSCRIPTIONS_NON_PRO_CTA,
  SUBSCRIPTIONS_NON_PRO_SECTION_LABEL,
  SUBSCRIPTIONS_NON_PRO_SUBTITLE,
  SUBSCRIPTIONS_NON_PRO_TITLE,
} from '../constants/setupCopy';

/**
 * Gate when the shop is not on Pro — App Store–safe web CTA (mirrors payments upsell layout).
 */
export function SubscriptionsNonProGate() {
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
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 22,
          fontWeight: '600',
          letterSpacing: -0.45,
          lineHeight: 28,
        },
        subtitle: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
        },
        sectionLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 1.35,
          marginTop: 20,
          textTransform: 'uppercase',
        },
        list: {
          marginBottom: 2,
          marginTop: 10,
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
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          fontWeight: '600',
          lineHeight: 22,
        },
        benefitRest: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
        },
        ctaWrap: {
          marginTop: 18,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root} testID="subscriptions-non-pro-gate">
      <SurfaceCard outlined padding="md" style={styles.card}>
        <View style={styles.headerBlock}>
          <AppText accessibilityRole="header" style={styles.title}>
            {SUBSCRIPTIONS_NON_PRO_TITLE}
          </AppText>
          <AppText style={styles.subtitle}>{SUBSCRIPTIONS_NON_PRO_SUBTITLE}</AppText>
        </View>

        <AppText style={styles.sectionLabel}>{SUBSCRIPTIONS_NON_PRO_SECTION_LABEL}</AppText>

        <View style={styles.list}>
          {SUBSCRIPTIONS_NON_PRO_BENEFITS.map(({ lead, rest }) => (
            <View key={`benefit-${lead}`} style={styles.benefitRow}>
              <View style={styles.marker} />
              <View style={styles.benefitTextCol}>
                <AppText>
                  <AppText style={styles.benefitLead}>{lead}</AppText>
                  {'  '}
                  <AppText style={styles.benefitRest}>{rest}</AppText>
                </AppText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.ctaWrap}>
          <Button
            fullWidth
            title={SUBSCRIPTIONS_NON_PRO_CTA}
            variant="secondary"
            onPress={handleSignInOnWeb}
          />
        </View>
      </SurfaceCard>
    </View>
  );
}
