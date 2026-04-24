import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, AppTextInput, Button, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

export function CustomerNotesSection({
  notes,
  isEditing = false,
  draftNotes = '',
  onChangeDraftNotes,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  saveLoading = false,
}) {
  const { colors } = useTheme();
  const resolvedNotes =
    typeof notes === 'string' && notes.trim().length > 0 ? notes : 'No notes yet.';
  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          rowGap: 8,
        },
        headerRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        title: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        editIconButton: {
          alignItems: 'center',
          borderRadius: 999,
          height: 30,
          justifyContent: 'center',
          width: 30,
        },
        card: {
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        body: {
          color: colors.textSecondary,
          fontSize: 16,
          fontWeight: '400',
          letterSpacing: -0.15,
          lineHeight: 24,
        },
        input: {
          color: colors.textSecondary,
          fontSize: 16,
          fontWeight: '400',
          letterSpacing: -0.15,
          lineHeight: 24,
          minHeight: 140,
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
    [colors],
  );

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <AppText style={styles.title}>Your notes</AppText>
        {!isEditing ? (
          <Pressable
            accessibilityLabel="Edit customer notes"
            accessibilityRole="button"
            onPress={onStartEdit}
            style={({ pressed }) => [styles.editIconButton, pressed && { opacity: 0.65 }]}
          >
            <Ionicons color={colors.textMuted} name="create-outline" size={18} />
          </Pressable>
        ) : null}
      </View>

      <SurfaceCard style={styles.card}>
        {isEditing ? (
          <>
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
          </>
        ) : (
          <AppText style={styles.body}>{resolvedNotes}</AppText>
        )}
      </SurfaceCard>
    </View>
  );
}
