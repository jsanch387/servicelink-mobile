import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { BottomSheetModal } from './BottomSheetModal';
import { Button } from './Button';

/**
 * Niche picker — selected jobs as removable chips, plus opens the sheet.
 *
 * @param {{
 *   options: readonly { slug: string; label: string }[];
 *   value: readonly string[];
 *   onChange: (next: string[]) => void;
 *   error?: string;
 *   fieldStyle?: object;
 * }} props
 */
export function SpecialtyChips({ options, value, onChange, error, fieldStyle }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => new Set(value), [value]);
  const hasError = Boolean(error?.trim());
  const selectedOptions = options.filter((option) => selected.has(option.slug));
  const canAddMore = selectedOptions.length < options.length;

  const close = useCallback(() => setOpen(false), []);

  const toggle = useCallback(
    (slug) => {
      if (selected.has(slug)) {
        onChange(value.filter((item) => item !== slug));
        return;
      }
      onChange([...value, slug]);
    },
    [onChange, selected, value],
  );

  const remove = useCallback(
    (slug) => {
      onChange(value.filter((item) => item !== slug));
    },
    [onChange, value],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        field: {
          marginTop: 14,
        },
        fieldLabel: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          marginBottom: 8,
        },
        required: {
          color: colors.danger,
        },
        chips: {
          alignItems: 'center',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        chip: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.borderStrong,
          borderRadius: 12,
          borderWidth: 1,
          flexDirection: 'row',
          paddingLeft: 10,
          paddingRight: 4,
          paddingVertical: 6,
        },
        chipPressed: {
          opacity: 0.8,
        },
        chipLabelCol: {
          justifyContent: 'center',
          maxWidth: 200,
        },
        chipLabel: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
        chipRemove: {
          alignItems: 'center',
          height: 26,
          justifyContent: 'center',
          width: 26,
        },
        emptyShell: {
          alignItems: 'center',
          backgroundColor: 'transparent',
          borderColor: colors.inputBorder,
          borderRadius: 16,
          borderStyle: 'dashed',
          borderWidth: 1.5,
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
          minHeight: 48,
          paddingHorizontal: 14,
          width: '100%',
        },
        emptyLabel: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '600',
        },
        addChip: {
          alignItems: 'center',
          backgroundColor: 'transparent',
          borderColor: colors.inputBorder,
          borderRadius: 12,
          borderStyle: 'dashed',
          borderWidth: 1,
          flexDirection: 'row',
          paddingLeft: 10,
          paddingRight: 4,
          paddingVertical: 6,
        },
        addIconCol: {
          alignItems: 'center',
          height: 26,
          justifyContent: 'center',
          width: 26,
        },
        addLabel: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
        error: {
          color: colors.danger,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 16,
          marginTop: 8,
        },
        list: {
          gap: 8,
          paddingBottom: 20,
        },
        row: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.borderStrong,
          borderRadius: 14,
          borderWidth: 1,
          flexDirection: 'row',
          minHeight: 52,
          paddingHorizontal: 14,
          paddingVertical: 12,
          width: '100%',
        },
        rowPressed: {
          opacity: 0.82,
        },
        labelColRow: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
          paddingRight: 12,
        },
        rowLabel: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        checkCol: {
          alignItems: 'center',
          height: 26,
          justifyContent: 'center',
          width: 26,
        },
        footer: {
          marginTop: 8,
        },
      }),
    [colors],
  );

  return (
    <View style={[styles.field, fieldStyle]}>
      <AppText style={styles.fieldLabel}>
        Your services <AppText style={styles.required}>*</AppText>
      </AppText>

      {selectedOptions.length === 0 ? (
        <Pressable
          accessibilityHint="Opens a list of services to add"
          accessibilityLabel="Add a service"
          accessibilityRole="button"
          onPress={() => setOpen(true)}
        >
          {({ pressed }) => (
            <View style={[styles.emptyShell, pressed && styles.chipPressed]}>
              <Ionicons color={colors.textMuted} name="add" size={20} />
              <AppText style={styles.emptyLabel}>Add a service</AppText>
            </View>
          )}
        </Pressable>
      ) : (
        <View style={styles.chips}>
          {selectedOptions.map((option) => (
            <Pressable
              key={option.slug}
              accessibilityLabel={`Remove ${option.label}`}
              accessibilityRole="button"
              onPress={() => remove(option.slug)}
            >
              {({ pressed }) => (
                <View style={[styles.chip, pressed && styles.chipPressed]}>
                  <View style={styles.chipLabelCol}>
                    <AppText numberOfLines={1} style={styles.chipLabel}>
                      {option.label}
                    </AppText>
                  </View>
                  <View style={styles.chipRemove}>
                    <Ionicons color={colors.textMuted} name="close" size={16} />
                  </View>
                </View>
              )}
            </Pressable>
          ))}

          {canAddMore ? (
            <Pressable
              accessibilityHint="Opens a list of services to add"
              accessibilityLabel="Add a service"
              accessibilityRole="button"
              onPress={() => setOpen(true)}
            >
              {({ pressed }) => (
                <View style={[styles.addChip, pressed && styles.chipPressed]}>
                  <View style={styles.chipLabelCol}>
                    <AppText style={styles.addLabel}>Add</AppText>
                  </View>
                  <View style={styles.addIconCol}>
                    <Ionicons color={colors.textMuted} name="add" size={16} />
                  </View>
                </View>
              )}
            </Pressable>
          ) : null}
        </View>
      )}

      {hasError ? (
        <AppText accessibilityLiveRegion="polite" style={styles.error}>
          {error.trim()}
        </AppText>
      ) : null}

      <BottomSheetModal
        allowBackdropClose
        fitContent
        footer={
          <View style={styles.footer}>
            <Button fullWidth title="Done" variant="primary" onPress={close} />
          </View>
        }
        showCloseButton={false}
        subtitle={
          selectedOptions.length ? `${selectedOptions.length} selected` : 'Select all that apply.'
        }
        title="Your services"
        visible={open}
        onRequestClose={close}
      >
        <View style={styles.list}>
          {options.map((option) => {
            const isOn = selected.has(option.slug);
            return (
              <Pressable
                key={option.slug}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isOn }}
                onPress={() => toggle(option.slug)}
              >
                {({ pressed: rowPressed }) => (
                  <View style={[styles.row, rowPressed && styles.rowPressed]}>
                    <View style={styles.labelColRow}>
                      <AppText numberOfLines={1} style={styles.rowLabel}>
                        {option.label}
                      </AppText>
                    </View>
                    <View style={styles.checkCol}>
                      {isOn ? (
                        <Ionicons color={colors.tabBarActive} name="checkmark-circle" size={26} />
                      ) : (
                        <Ionicons color={colors.borderStrong} name="ellipse-outline" size={26} />
                      )}
                    </View>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </BottomSheetModal>
    </View>
  );
}
