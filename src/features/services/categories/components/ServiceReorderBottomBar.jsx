import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/**
 * Fixed footer actions — same Cancel / primary row as {@link FormBottomSheetModal}.
 */
export function ServiceReorderBottomBar({ isSaving, onCancel, onSave }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.host,
        {
          backgroundColor: colors.shell,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View style={styles.actions}>
        <Button
          disabled={isSaving}
          labelColor={colors.text}
          outlineColor={colors.borderStrong}
          style={styles.actionBtn}
          title="Cancel"
          variant="outline"
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
    borderTopWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    position: 'absolute',
    right: 0,
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
