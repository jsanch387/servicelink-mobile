import { StyleSheet, View } from 'react-native';
import { AppText, Button } from '../../../components/ui';
import { useTheme } from '../../../theme';

/**
 * Payments requires **Pro**. Opens Stripe upgrade checkout from parent (`Upgrade to Pro`).
 */
export function PaymentsNonProUpsell({ onUpgradePress, upgradeSubmitting }) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <AppText style={[styles.title, { color: colors.text }]}>Payments are a Pro feature</AppText>
      <AppText style={[styles.body, { color: colors.textMuted }]}>
        Upgrade to Pro to access Stripe Connect, ServiceLink checkout, deposits, and how customers
        pay—all from this tab.
      </AppText>
      <Button
        fullWidth
        labelColor="#0b0c0f"
        loading={upgradeSubmitting}
        title="Upgrade to Pro"
        variant="surfaceLight"
        onPress={onUpgradePress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  body: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
  },
});
