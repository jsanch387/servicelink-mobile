import { useCallback, useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { AppText, Button, Divider, SurfaceCard } from '../../../components/ui';
import { getWebAccountAdminUrl } from '../../../lib/webAppOrigin';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  INVOICES_WEB_ACCESS_BENEFITS,
  INVOICES_WEB_ACCESS_CTA,
  INVOICES_WEB_ACCESS_SECTION_LABEL,
  INVOICES_WEB_ACCESS_SUBTITLE,
  INVOICES_WEB_ACCESS_TITLE,
} from '../constants/invoiceAccessCopy';

/**
 * Invoices require Pro — subscribe on web (App Store–safe; same card as payments).
 */
export function InvoicesNonProUpsell() {
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
          minWidth: 0,
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
    <View style={styles.root} testID="invoices-non-pro-upsell">
      <SurfaceCard outlined padding="md" style={styles.card}>
        <View style={styles.headerBlock}>
          <AppText accessibilityRole="header" style={styles.title}>
            {INVOICES_WEB_ACCESS_TITLE}
          </AppText>
          <AppText style={styles.subtitle}>{INVOICES_WEB_ACCESS_SUBTITLE}</AppText>
        </View>

        <AppText style={styles.sectionLabel}>{INVOICES_WEB_ACCESS_SECTION_LABEL}</AppText>

        <View style={styles.list}>
          {INVOICES_WEB_ACCESS_BENEFITS.map(({ lead, rest }, index) => (
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
            iconName="open-outline"
            iconPosition="right"
            title={INVOICES_WEB_ACCESS_CTA}
            variant="secondary"
            onPress={handleSignInOnWeb}
          />
        </View>
      </SurfaceCard>
    </View>
  );
}
