import { useMemo } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { AppText, Divider, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { quotesAcceptRequestsAccessCopy } from '../constants/quotesAccessCopy';
import { QuotesProInlineUpsell } from './QuotesProInlineUpsell';

/**
 * Toggle for `business_profiles.accept_quote_req` — public booking link quote requests.
 * When `proLocked`, the switch is off and disabled and a web sign-in strip is shown.
 */
export function QuotesAcceptRequestsCard({
  value,
  onValueChange,
  disabled = false,
  proLocked = false,
  onWebSignInPress,
}) {
  const { colors } = useTheme();
  const switchDisabled = disabled || proLocked;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        cardShell: {
          /** Tighter than default `md` bottom — toggle row + upsell read closer to the card edge. */
          paddingBottom: 10,
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 14,
        },
        textBlock: {
          flex: 1,
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 13,
          lineHeight: 18,
          marginTop: 4,
        },
        dividerAfterRow: {
          marginBottom: 0,
          marginTop: 10,
        },
      }),
    [colors],
  );

  return (
    <SurfaceCard outlined padding="md" style={styles.cardShell}>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <AppText style={styles.title}>Accept quote requests</AppText>
          <AppText style={styles.subtitle}>
            {proLocked
              ? quotesAcceptRequestsAccessCopy.cardSubtitle
              : 'Turn on to let people ask for a quote from your booking link.'}
          </AppText>
        </View>
        <Switch
          accessibilityLabel="Accept quote requests from booking link"
          accessibilityState={{ disabled: switchDisabled }}
          disabled={switchDisabled}
          thumbColor={value ? '#f8fafc' : '#f4f4f5'}
          trackColor={{ false: colors.borderStrong, true: '#10b981' }}
          value={value}
          onValueChange={onValueChange}
        />
      </View>

      {proLocked ? (
        <>
          <Divider style={styles.dividerAfterRow} />
          <QuotesProInlineUpsell onWebSignInPress={onWebSignInPress ?? (() => {})} />
        </>
      ) : null}
    </SurfaceCard>
  );
}
