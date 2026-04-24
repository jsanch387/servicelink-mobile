import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

export function CustomerDetailActionsSection({
  onSendText,
  onRemoveCustomer,
  removeLoading = false,
}) {
  const { colors } = useTheme();
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
      <Button
        disabled={removeLoading}
        fullWidth
        iconName="trash-outline"
        iconColor={colors.danger}
        loading={removeLoading}
        onPress={onRemoveCustomer}
        outlineColor={colors.danger}
        title="Remove customer"
        variant="outline"
      />
    </View>
  );
}
