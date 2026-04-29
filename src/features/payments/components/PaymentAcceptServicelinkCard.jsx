import { StyleSheet, Switch, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { paymentTextStyles } from '../constants/paymentTypography';

/**
 * Global “accept payments on ServiceLink” toggle (layout matches web payment settings).
 */
export function PaymentAcceptServicelinkCard({ value, onValueChange }) {
  const { colors } = useTheme();

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.row}>
        <View style={styles.textWrap}>
          <AppText style={[paymentTextStyles.toggleTitle, { color: colors.text }]}>
            Accept payments on ServiceLink
          </AppText>
          <AppText style={[paymentTextStyles.toggleHint, { color: colors.textMuted }]}>
            Turn off to pause ServiceLink checkout.
          </AppText>
        </View>
        <Switch
          thumbColor={value ? '#f8fafc' : '#f4f4f5'}
          trackColor={{ false: colors.borderStrong, true: '#10b981' }}
          value={value}
          onValueChange={onValueChange}
        />
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 0,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
});
