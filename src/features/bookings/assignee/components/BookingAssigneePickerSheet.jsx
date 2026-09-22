import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  BottomSheetModal,
  InlineCardError,
  SubmitOutcomePending,
} from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { presentAssigneeDisplay } from '../utils/mapBookingAssignees';

/**
 * @param {{
 *   options: Array<{ userId: string | null; label: string; kind: string }>;
 *   selectedUserId: string | null;
 *   visible: boolean;
 *   saving?: boolean;
 *   errorMessage?: string | null;
 *   onRequestClose: () => void;
 *   onSelect: (userId: string | null) => void;
 * }} props
 */
export function BookingAssigneePickerSheet({
  options,
  selectedUserId,
  visible,
  saving = false,
  errorMessage = null,
  onRequestClose,
  onSelect,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: {
          gap: 2,
          paddingBottom: 8,
          width: '100%',
        },
        errorWrap: {
          paddingBottom: 8,
        },
        pressable: {
          width: '100%',
        },
        row: {
          alignItems: 'center',
          borderRadius: 14,
          flexDirection: 'row',
          minHeight: 56,
          paddingHorizontal: 8,
          paddingVertical: 10,
          width: '100%',
        },
        pressed: {
          backgroundColor: colors.buttonGhostPressed,
        },
        selectedRow: {
          backgroundColor: colors.buttonGhostPressed,
        },
        avatar: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 18,
          borderWidth: 1,
          height: 36,
          justifyContent: 'center',
          marginRight: 12,
          width: 36,
        },
        avatarLetter: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
        },
        copyCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        subtitle: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          marginTop: 2,
        },
        checkCol: {
          alignItems: 'center',
          height: 22,
          justifyContent: 'center',
          marginLeft: 10,
          width: 22,
        },
      }),
    [colors],
  );

  return (
    <BottomSheetModal
      allowBackdropClose={!saving}
      fitContent
      showCloseButton={!saving}
      showHeaderDivider
      title="Assignee"
      visible={visible}
      onRequestClose={saving ? () => {} : onRequestClose}
    >
      {saving ? (
        <SubmitOutcomePending accessibilityLabel="Assigning job" title="Assigning job" />
      ) : (
        <View style={styles.list}>
          {errorMessage ? (
            <View style={styles.errorWrap}>
              <InlineCardError message={errorMessage} />
            </View>
          ) : null}
          {options.map((option) => {
            const selected = (option.userId ?? null) === (selectedUserId ?? null);
            const display = presentAssigneeDisplay(option.label);
            const isUnassigned = option.kind === 'unassigned';
            const a11y = display.subtitle ? `${display.title}, ${display.subtitle}` : display.title;
            return (
              <Pressable
                key={option.userId ?? 'unassigned'}
                accessibilityLabel={a11y}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={styles.pressable}
                onPress={() => onSelect(option.userId)}
              >
                {({ pressed }) => (
                  <View style={[styles.row, (pressed || selected) && styles.pressed]}>
                    <View style={styles.avatar}>
                      {isUnassigned ? (
                        <Ionicons color={colors.textMuted} name="person-outline" size={16} />
                      ) : (
                        <AppText style={styles.avatarLetter}>{display.initial}</AppText>
                      )}
                    </View>
                    <View style={styles.copyCol}>
                      <AppText numberOfLines={1} style={styles.title}>
                        {display.title}
                      </AppText>
                      {display.subtitle ? (
                        <AppText numberOfLines={1} style={styles.subtitle}>
                          {display.subtitle}
                        </AppText>
                      ) : null}
                    </View>
                    <View style={styles.checkCol}>
                      {selected ? (
                        <Ionicons color={colors.accent} name="checkmark" size={20} />
                      ) : null}
                    </View>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </BottomSheetModal>
  );
}
