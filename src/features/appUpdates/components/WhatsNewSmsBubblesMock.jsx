import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAccountSettings } from '../../more/hooks/useAccountSettings';
import { RotatingCustomerSmsBubble } from '../../sms/components/RotatingCustomerSmsBubble';

/**
 * Compact rotating customer-SMS bubble for the What’s new modal.
 */
export function WhatsNewSmsBubblesMock() {
  const { business } = useAccountSettings();
  const businessName = useMemo(
    () => business?.business_name?.trim() || null,
    [business?.business_name],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          marginBottom: 16,
          marginTop: 2,
          width: '100%',
        },
      }),
    [],
  );

  return (
    <View style={styles.root}>
      <RotatingCustomerSmsBubble businessName={businessName} compact />
    </View>
  );
}
