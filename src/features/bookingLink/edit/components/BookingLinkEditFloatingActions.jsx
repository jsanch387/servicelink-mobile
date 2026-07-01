import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

export function BookingLinkEditFloatingActions({
  canSave,
  colors,
  isSaving,
  previewOutlineColor,
  onDoneEditing,
  onSave,
}) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        shell: {
          alignItems: 'center',
          bottom: Math.max(insets.bottom, 16),
          left: 0,
          paddingHorizontal: 16,
          position: 'absolute',
          right: 0,
          zIndex: 20,
        },
        card: {
          alignSelf: 'stretch',
          backgroundColor: themeColors.cardSurface,
          borderColor: themeColors.border,
          borderRadius: 20,
          borderWidth: 1,
          elevation: 8,
          maxWidth: 520,
          padding: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.14,
          shadowRadius: 16,
          width: '100%',
        },
        row: {
          flexDirection: 'row',
          gap: 10,
          width: '100%',
        },
        actionCell: {
          flex: 1,
          flexBasis: 0,
          minWidth: 0,
        },
      }),
    [insets.bottom, themeColors],
  );

  return (
    <View pointerEvents="box-none" style={styles.shell}>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.actionCell}>
            <Button
              accessibilityHint="Exits edit mode and returns to your booking link profile"
              accessibilityLabel="Done"
              fullWidth
              labelColor={colors.text}
              outlineBg={colors.buttonSecondaryBg}
              outlineBgPressed={colors.buttonSecondaryBgPressed}
              outlineColor={previewOutlineColor}
              outlineThin
              title="Done"
              variant="outline"
              onPress={onDoneEditing}
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
