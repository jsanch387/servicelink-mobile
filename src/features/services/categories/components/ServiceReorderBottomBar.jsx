import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../../components/ui';

/**
 * Floating Cancel / Save order actions while reordering the catalog.
 */
export function ServiceReorderBottomBar({ isSaving, onCancel, onSave }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.host, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.actions}>
        <Button
          disabled={isSaving}
          style={styles.actionBtn}
          title="Cancel"
          variant="secondary"
          onPress={onCancel}
        />
        <Button
          disabled={isSaving}
          loading={isSaving}
          style={styles.actionBtn}
          title="Save order"
          variant="surfaceLight"
          onPress={onSave}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    left: 16,
    position: 'absolute',
    right: 16,
  },
  actions: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    minWidth: 0,
  },
});
