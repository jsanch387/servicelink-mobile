import { useCallback, useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { AppText, Button, Divider, SurfaceCard } from '../../../components/ui';
import { getWebAccountAdminUrl } from '../../../lib/webAppOrigin';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  TEAM_PLAN_ACCESS_BENEFITS,
  TEAM_PLAN_ACCESS_CTA,
  TEAM_PLAN_ACCESS_SUBTITLE,
  TEAM_PLAN_ACCESS_TITLE,
} from '../constants/teamPlanAccessCopy';

/**
 * Free and Pro owners can open Team. Inviting requires the Team plan, which is sold on the web.
 */
export function TeamPlanCta() {
  const { colors } = useTheme();

  const handleSubscribeOnWeb = useCallback(() => {
    void Linking.openURL(getWebAccountAdminUrl());
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          minWidth: 0,
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
    <SurfaceCard outlined padding="md" style={styles.card}>
      <View style={styles.headerBlock}>
        <AppText accessibilityRole="header" style={styles.title}>
          {TEAM_PLAN_ACCESS_TITLE}
        </AppText>
        <AppText style={styles.subtitle}>{TEAM_PLAN_ACCESS_SUBTITLE}</AppText>
      </View>

      <View style={styles.list}>
        {TEAM_PLAN_ACCESS_BENEFITS.map(({ lead, rest }, index) => (
          <View key={lead}>
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
          iconName="open-outline"
          iconPosition="right"
          title={TEAM_PLAN_ACCESS_CTA}
          variant="secondary"
          onPress={handleSubscribeOnWeb}
        />
      </View>
    </SurfaceCard>
  );
}
