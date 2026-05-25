import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { DeleteButton } from '../../../components/ui';
import { MAINTENANCE_DETAIL_DELETE_BUTTON } from '../constants';

/**
 * @param {object} props
 * @param {() => void} props.onRemove
 * @param {boolean} [props.removeLoading]
 */
export function MaintenanceDetailDangerSection({ onRemove, removeLoading = false }) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginTop: 0,
        },
      }),
    [],
  );

  return (
    <View style={styles.wrap}>
      <DeleteButton
        disabled={removeLoading}
        loading={removeLoading}
        title={MAINTENANCE_DETAIL_DELETE_BUTTON}
        onPress={onRemove}
      />
    </View>
  );
}
