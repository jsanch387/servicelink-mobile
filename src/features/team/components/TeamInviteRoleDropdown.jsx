import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { fireSelectionHaptic } from '../../../utils/feedbackHaptics';
import { ASSIGNABLE_TEAM_ROLES, TEAM_ROLE_COPY } from '../constants/teamRoles';

const ROLE_OPTIONS = ASSIGNABLE_TEAM_ROLES.map((role) => ({
  value: role,
  label: TEAM_ROLE_COPY[role].label,
  description: TEAM_ROLE_COPY[role].description,
}));

/**
 * Invite-sheet role menu. It opens under the field and does not present a bottom sheet.
 */
export function TeamInviteRoleDropdown({ value, onChange, disabled = false }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);
  const selected = ROLE_OPTIONS.find((option) => option.value === value) ?? ROLE_OPTIONS[0];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        label: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          marginBottom: 8,
        },
        trigger: {
          alignSelf: 'stretch',
          width: '100%',
        },
        triggerShell: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: open || pressed ? colors.borderStrong : colors.inputBorder,
          borderRadius: 16,
          borderWidth: open || pressed ? 1.5 : 1,
          flexDirection: 'row',
          minHeight: 52,
          paddingHorizontal: 12,
        },
        triggerPressed: {
          opacity: 0.9,
        },
        triggerDisabled: {
          opacity: 0.55,
        },
        valueCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
          paddingLeft: 6,
          paddingRight: 10,
        },
        value: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '500',
        },
        chevronCol: {
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
        },
        menu: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.inputBorder,
          borderRadius: 16,
          borderWidth: 1,
          marginTop: 6,
          padding: 6,
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
      }),
    [colors, open, pressed],
  );

  return (
    <View>
      <AppText style={styles.label}>Role</AppText>
      <Pressable
        accessibilityLabel={`Role. Currently ${selected.label}. Tap to change.`}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={() => {
          if (disabled) return;
          Keyboard.dismiss();
          fireSelectionHaptic();
          setOpen((current) => !current);
        }}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={styles.trigger}
      >
        <View
          style={[
            styles.triggerShell,
            pressed && styles.triggerPressed,
            disabled && styles.triggerDisabled,
          ]}
        >
          <View style={styles.valueCol}>
            <AppText numberOfLines={1} style={styles.value}>
              {selected.label}
            </AppText>
          </View>
          <View style={styles.chevronCol}>
            <Ionicons
              color={colors.textMuted}
              name={open ? 'chevron-up' : 'chevron-down'}
              size={22}
            />
          </View>
        </View>
      </Pressable>
      {open && !disabled ? (
        <View accessibilityRole="menu" style={styles.menu}>
          {ROLE_OPTIONS.map((option) => {
            const isSelected = option.value === selected.value;
            return (
              <Pressable
                key={option.value}
                accessibilityLabel={option.label}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: isSelected }}
                style={styles.option}
                onPress={() => {
                  fireSelectionHaptic();
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {({ pressed: optionPressed }) => (
                  <View
                    style={[
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                      optionPressed && styles.optionRowPressed,
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
      ) : null}
    </View>
  );
}
