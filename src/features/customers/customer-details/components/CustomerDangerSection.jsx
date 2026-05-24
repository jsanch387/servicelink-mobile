import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { DeleteButton } from '../../../../components/ui';

export function CustomerDangerSection({ onRemoveCustomer, removeLoading = false }) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginTop: 22,
        },
      }),
    [],
  );

  return (
    <View style={styles.wrap}>
      <DeleteButton
        disabled={removeLoading}
        loading={removeLoading}
        title="Remove customer"
        onPress={onRemoveCustomer}
      />
    </View>
  );
}
