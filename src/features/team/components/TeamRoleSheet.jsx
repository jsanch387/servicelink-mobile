import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button, InlineCardError } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { fireSelectionHaptic } from '../../../utils/feedbackHaptics';
import { TEAM_ROLE_SAVE_BUTTON, TEAM_ROLE_SHEET_TITLE } from '../constants/teamMembersCopy';
import { ASSIGNABLE_TEAM_ROLES, storedTeamRole, TEAM_ROLE_COPY } from '../constants/teamRoles';

const ROLE_OPTIONS = ASSIGNABLE_TEAM_ROLES.map((role) => ({
  value: role,
  label: TEAM_ROLE_COPY[role].label,
  description: TEAM_ROLE_COPY[role].description,
}));

/**
 * Pick a teammate's role, then save. Closing discards the draft.
 */
export function TeamRoleSheet({
  visible,
  value,
  saving = false,
  errorMessage = null,
  onRequestClose,
  onSave,
}) {
  const { colors } = useTheme();
  const stored = storedTeamRole(value);
  const [draft, setDraft] = useState(stored);

  useEffect(() => {
    if (visible) {
      setDraft(stored);
    }
  }, [stored, visible]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: {
          width: '100%',
        },
        option: {
          alignSelf: 'stretch',
          width: '100%',
        },
        optionRow: {
          alignItems: 'center',
          borderRadius: 12,
          flexDirection: 'row',
          paddingHorizontal: 12,
          paddingVertical: 12,
          width: '100%',
        },
        optionRowSelected: {
          backgroundColor: colors.buttonGhostPressed,
        },
        optionRowPressed: {
          opacity: 0.72,
        },
        optionLabelCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
          paddingRight: 12,
        },
        optionLabel: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
        },
        optionDescription: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '400',
          lineHeight: 20,
          marginTop: 4,
        },
        checkCol: {
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
        },
        errorWrap: {
          marginBottom: 8,
        },
        footer: {
          paddingTop: 8,
        },
      }),
    [colors],
  );

  return (
    <BottomSheetModal
      allowBackdropClose={!saving}
      fitContent
      footer={
        <View style={styles.footer}>
          <Button
            disabled={saving || draft === stored}
            fullWidth
            loading={saving}
            title={TEAM_ROLE_SAVE_BUTTON}
            onPress={() => {
              onSave(draft);
            }}
          />
        </View>
      }
      showCloseButton={!saving}
      title={TEAM_ROLE_SHEET_TITLE}
      visible={visible}
      onRequestClose={saving ? () => {} : onRequestClose}
    >
      {errorMessage ? (
        <View style={styles.errorWrap}>
          <InlineCardError message={errorMessage} />
        </View>
      ) : null}
      <View accessibilityRole="menu" style={styles.list}>
        {ROLE_OPTIONS.map((option) => {
          const isSelected = option.value === draft;
          return (
            <Pressable
              key={option.value}
              accessibilityLabel={option.label}
              accessibilityRole="menuitem"
              accessibilityState={{ disabled: saving, selected: isSelected }}
              disabled={saving}
              style={styles.option}
              onPress={() => {
                fireSelectionHaptic();
                setDraft(option.value);
              }}
            >
              {({ pressed }) => (
                <View
                  style={[
                    styles.optionRow,
                    isSelected && styles.optionRowSelected,
                    pressed && styles.optionRowPressed,
                  ]}
                >
                  <View style={styles.optionLabelCol}>
                    <AppText style={styles.optionLabel}>{option.label}</AppText>
                    <AppText style={styles.optionDescription}>{option.description}</AppText>
                  </View>
                  <View style={styles.checkCol}>
                    {isSelected ? (
                      <Ionicons color={colors.textMuted} name="checkmark" size={18} />
                    ) : null}
                  </View>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </BottomSheetModal>
  );
}
