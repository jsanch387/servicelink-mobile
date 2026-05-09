import { useMemo } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

/**
 * Toggle for `business_profiles.accept_quote_req` — public booking link quote requests.
 */
export function QuotesAcceptRequestsCard({ value, onValueChange, disabled = false }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
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
      }),
    [colors],
  );

  return (
    <SurfaceCard padding="md">
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <AppText style={styles.title}>Accept quote requests</AppText>
          <AppText style={styles.subtitle}>
            Turn on to let people ask for a quote from your booking link.
          </AppText>
        </View>
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
    </SurfaceCard>
  );
}
