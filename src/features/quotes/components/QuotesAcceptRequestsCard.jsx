import { useMemo } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { quotesAcceptRequestsAccessCopy } from '../constants/quotesAccessCopy';

/**
 * Toggle for `business_profiles.accept_quote_req` — public booking link quote requests.
 * When `proLocked`, the switch is hidden and a website subscribe CTA is shown.
 */
export function QuotesAcceptRequestsCard({
  value,
  onValueChange,
  disabled = false,
  proLocked = false,
  onWebSignInPress,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 16,
          width: '100%',
        },
        textBlock: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.15,
          lineHeight: 20,
        },
        subtitle: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          marginTop: 5,
        },
        switchCol: {
          alignItems: 'flex-end',
          flexShrink: 0,
          justifyContent: 'center',
        },
        lockedStack: {
          gap: 12,
        },
        lockedTitle: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        lockedBody: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 22,
        },
        lockedHint: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
        },
        ctaWrap: {
          marginTop: 2,
        },
      }),
    [colors],
  );

  if (proLocked) {
    return (
      <SurfaceCard outlined padding="md">
        <View style={styles.lockedStack}>
          <AppText style={styles.lockedTitle}>{quotesAcceptRequestsAccessCopy.cardTitle}</AppText>
          <AppText style={styles.lockedBody}>{quotesAcceptRequestsAccessCopy.cardSubtitle}</AppText>
          <AppText style={styles.lockedHint}>{quotesAcceptRequestsAccessCopy.cardHint}</AppText>
          <View style={styles.ctaWrap}>
            <Button
              accessibilityHint="Opens ServiceLink on the web to subscribe"
              accessibilityLabel={quotesAcceptRequestsAccessCopy.inlineAction}
              fullWidth
              title={quotesAcceptRequestsAccessCopy.inlineAction}
              variant="secondary"
              onPress={onWebSignInPress ?? (() => {})}
            />
          </View>
        </View>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard outlined padding="md">
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <AppText style={styles.title}>{quotesAcceptRequestsAccessCopy.cardTitle}</AppText>
          <AppText style={styles.subtitle}>Show “Request a quote” on your booking link.</AppText>
        </View>
        <View style={styles.switchCol}>
          <Switch
            accessibilityLabel="Accept quote requests from booking link"
            accessibilityState={{ disabled }}
            disabled={disabled}
            thumbColor={value ? '#f8fafc' : '#f4f4f5'}
            trackColor={{ false: colors.borderStrong, true: '#10b981' }}
            value={value}
            onValueChange={onValueChange}
          />
        </View>
      </View>
    </SurfaceCard>
  );
}
