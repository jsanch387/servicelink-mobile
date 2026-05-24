import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, AppTextInput, Button, SettingsSection } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

export function CustomerNotesSection({
  notes,
  isEditing = false,
  draftNotes = '',
  first = false,
  onChangeDraftNotes,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  saveLoading = false,
}) {
  const { colors } = useTheme();
  const resolvedNotes =
    typeof notes === 'string' && notes.trim().length > 0 ? notes : 'No notes yet.';
  const isEmpty = !(typeof notes === 'string' && notes.trim().length > 0);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bodyRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        body: {
          color: isEmpty ? colors.placeholder : colors.textSecondary,
          flex: 1,
          fontSize: 16,
          fontWeight: '400',
          letterSpacing: -0.15,
          lineHeight: 24,
          minWidth: 0,
        },
        editIconButton: {
          alignItems: 'center',
          borderRadius: 999,
          height: 30,
          justifyContent: 'center',
          marginTop: -2,
          width: 30,
        },
        editWrap: {
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 16,
        },
        input: {
          color: colors.textSecondary,
          fontSize: 16,
          fontWeight: '400',
          letterSpacing: -0.15,
          lineHeight: 24,
          minHeight: 120,
          paddingBottom: 4,
          paddingTop: 4,
          textAlignVertical: 'top',
        },
        actionsRow: {
          columnGap: 10,
          flexDirection: 'row',
          marginTop: 12,
        },
        actionCell: {
          flex: 1,
        },
      }),
    [colors, isEmpty],
  );

  return (
    <SettingsSection first={first} title="Notes">
      {isEditing ? (
        <View style={styles.editWrap}>
          <AppTextInput
            autoCapitalize="sentences"
            multiline
            onChangeText={onChangeDraftNotes}
            placeholder="Add notes about this customer"
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            value={draftNotes}
          />
          <View style={styles.actionsRow}>
            <View style={styles.actionCell}>
              <Button
                disabled={saveLoading}
                onPress={onCancelEdit}
                title="Cancel"
                variant="outline"
              />
            </View>
            <View style={styles.actionCell}>
              <Button loading={saveLoading} onPress={onSaveEdit} title="Save" variant="primary" />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.bodyRow}>
          <AppText style={styles.body}>{resolvedNotes}</AppText>
          <Pressable
            accessibilityLabel="Edit customer notes"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onStartEdit}
            style={({ pressed }) => [styles.editIconButton, pressed && { opacity: 0.65 }]}
          >
            <Ionicons color={colors.textMuted} name="create-outline" size={18} />
          </Pressable>
        </View>
      )}
    </SettingsSection>
  );
}
