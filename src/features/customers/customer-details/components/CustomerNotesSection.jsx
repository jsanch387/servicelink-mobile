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
  placeholder = 'Add notes about this customer',
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
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        body: {
          color: isEmpty ? colors.placeholder : colors.textSecondary,
          fontSize: 16,
          fontWeight: '400',
          letterSpacing: -0.15,
          lineHeight: 24,
        },
        editIconButton: {
          alignItems: 'center',
          borderRadius: 999,
          height: 30,
          justifyContent: 'center',
          marginRight: -4,
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

  const editAffordance =
    !isEditing && typeof onStartEdit === 'function' ? (
      <Pressable
        accessibilityLabel="Edit notes"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onStartEdit}
      >
        {({ pressed }) => (
          <View style={[styles.editIconButton, pressed && { opacity: 0.65 }]}>
            <Ionicons color={colors.textMuted} name="create-outline" size={18} />
          </View>
        )}
      </Pressable>
    ) : null;

  return (
    <SettingsSection first={first} title="Notes" titleRight={editAffordance}>
      {isEditing ? (
        <View style={styles.editWrap}>
          <AppTextInput
            autoCapitalize="sentences"
            multiline
            onChangeText={onChangeDraftNotes}
            placeholder={placeholder}
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
                variant="secondary"
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
        </View>
      )}
    </SettingsSection>
  );
}
