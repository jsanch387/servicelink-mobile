import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, DeleteButton } from '../../../../components/ui';

export function CustomerDetailActionsSection({
  onSendText,
  onRemoveCustomer,
  removeLoading = false,
}) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          rowGap: 10,
          marginTop: 4,
        },
      }),
    [],
  );

  return (
    <View style={styles.stack}>
      <Button
        disabled={removeLoading}
        fullWidth
        iconName="chatbubble-ellipses-outline"
        onPress={onSendText}
        title="Send a text"
        variant="primary"
      />
      <DeleteButton
        disabled={removeLoading}
        loading={removeLoading}
        title="Remove customer"
        onPress={onRemoveCustomer}
      />
    </View>
  );
}
