import { StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { paymentLayoutStyles, paymentTextStyles } from '../constants/paymentTypography';
import { PaymentMethodRadioTile } from './PaymentMethodRadioTile';

/**
 * Checkout preference radios (matches web “How customers pay” section). Save lives on the screen chrome.
 */
export function PaymentHowCustomersPayCard({ options, selectedId, onSelectId }) {
  const { colors } = useTheme();

  return (
    <SurfaceCard style={styles.card}>
      <View style={paymentLayoutStyles.headerTextGroup}>
        <AppText style={[paymentTextStyles.sectionTitle, { color: colors.text }]}>
          How customers pay
        </AppText>
        <AppText style={[paymentTextStyles.sectionBody, { color: colors.textMuted }]}>
          Choose how customers pay when they book a service with you.
        </AppText>
      </View>

      <View style={styles.tiles}>
        {options.map((opt) => (
          <PaymentMethodRadioTile
            key={opt.id}
            description={opt.description}
            selected={opt.id === selectedId}
            title={opt.title}
            onSelect={() => onSelectId(opt.id)}
          />
        ))}
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
  tiles: {
    alignSelf: 'stretch',
    gap: 10,
  },
});
