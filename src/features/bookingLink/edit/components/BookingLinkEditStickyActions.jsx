import { View } from 'react-native';
import { Button } from '../../../../components/ui';

export function BookingLinkEditStickyActions({
  styles,
  colors,
  previewOutlineColor,
  onPreview,
  onSave,
  canSave,
  isSaving,
}) {
  return (
    <View style={styles.stickyHeaderShell}>
      <View style={styles.topActionsCard}>
        <View style={styles.topActionsRow}>
          <View style={styles.actionCell}>
            <Button
              accessibilityLabel="Preview"
              fullWidth
              iconName="eye-outline"
              labelColor={colors.text}
              outlineBg={colors.buttonSecondaryBg}
              outlineBgPressed={colors.buttonSecondaryBgPressed}
              outlineColor={previewOutlineColor}
              outlineThin
              title="Preview"
              variant="outline"
              onPress={onPreview}
            />
          </View>
          <View style={styles.actionCell}>
            <Button
              accessibilityLabel="Save changes"
              disabled={!canSave}
              fullWidth
              loading={isSaving}
              title="Save Changes"
              variant="surfaceLight"
              onPress={onSave}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
