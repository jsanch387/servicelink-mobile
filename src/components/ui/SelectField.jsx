import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

/**
 * Opens a bottom sheet to pick one option. Trigger matches {@link TextField} outline styling.
 * Layout: full-screen backdrop (dismiss) + sheet only at the bottom (so touches work reliably).
 *
 * `presentation`: `sheet` (default) = scrollable rows; `wheel` = native picker in a compact sheet
 * (iOS spinner, Android dropdown). Web uses `sheet`.
 *
 * @param {{
 *   label?: string;
 *   title?: string;
 *   placeholder?: string;
 *   options: { value: string; label: string }[];
 *   value: string | null | undefined;
 *   onValueChange: (value: string) => void;
 *   presentation?: 'sheet' | 'wheel';
 * }} props
 */
export function SelectField({
  label,
  title,
  placeholder = 'Select',
  options,
  value,
  onValueChange,
  triggerStyle,
  /** Merged after outer field wrapper — use `{ marginTop: 0 }` when stacking under another labeled control. */
  fieldStyle,
  presentation = 'sheet',
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);

  const useWheel = presentation === 'wheel' && Platform.OS !== 'web';

  const selectedLabel = useMemo(() => {
    const hit = options.find((o) => o.value === value);
    return hit?.label ?? null;
  }, [options, value]);

  const pickerSelectedValue = useMemo(() => {
    if (value != null && value !== '' && options.some((o) => o.value === value)) {
      return value;
    }
    return options[0]?.value ?? '';
  }, [options, value]);

  const sheetTitle = title ?? label ?? 'Choose';

  const close = useCallback(() => setOpen(false), []);

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
        trigger: {
          alignSelf: 'stretch',
          width: '100%',
        },
        triggerShell: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: pressed ? colors.borderStrong : colors.inputBorder,
          borderRadius: 16,
          borderWidth: pressed ? 1.5 : 1,
          flexDirection: 'row',
          minHeight: 40,
          paddingHorizontal: 10,
          paddingVertical: 6,
        },
        triggerText: {
          color: colors.text,
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
          minHeight: 34,
          paddingLeft: 6,
          paddingRight: 10,
          paddingVertical: Platform.select({ android: 6, default: 8 }),
          textAlign: 'left',
        },
        triggerPlaceholder: {
          color: colors.placeholder,
          fontWeight: '500',
        },
        modalRoot: {
          flex: 1,
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: useWheel ? 'rgba(0,0,0,0.60)' : 'rgba(0,0,0,0.55)',
        },
        sheetWrap: {
          bottom: 0,
          left: 0,
          paddingBottom: Math.max(insets.bottom, 14) + 8,
          position: 'absolute',
          right: 0,
        },
        sheetWrapInset: {
          paddingHorizontal: 16,
        },
        sheetWrapWheel: {
          alignSelf: 'stretch',
          backgroundColor: colors.shellElevated,
          borderTopColor: colors.borderStrong,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderTopWidth: 1,
          overflow: 'hidden',
          paddingHorizontal: 0,
          width: '100%',
        },
        sheet: {
          overflow: 'hidden',
          ...(useWheel
            ? {
                backgroundColor: 'transparent',
                borderRadius: 0,
                borderWidth: 0,
              }
            : {
                backgroundColor: colors.shellElevated,
                borderColor: colors.borderStrong,
                borderRadius: 20,
                borderWidth: 1,
                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                  },
                  android: { elevation: 12 },
                  default: {},
                }),
              }),
        },
        sheetWheelBody: {
          paddingBottom: 8,
        },
        grabber: {
          alignSelf: 'center',
          backgroundColor: colors.borderStrong,
          borderRadius: 2,
          height: 4,
          marginBottom: 12,
          marginTop: 10,
          width: 36,
        },
        sheetHeader: {
          alignItems: 'center',
          borderBottomColor: colors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        sheetHeaderInset: {
          paddingBottom: 14,
          paddingHorizontal: 18,
          paddingTop: 4,
        },
        sheetHeaderWheel: {
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        sheetTitle: {
          color: colors.text,
          flex: 1,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.35,
          marginRight: 12,
        },
        sheetTitleWheel: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: 0,
        },
        closeHit: {
          padding: 4,
        },
        sheetDone: {
          color: colors.tabBarActive,
          fontSize: 17,
          fontWeight: '600',
          paddingVertical: 4,
          paddingHorizontal: 4,
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          minHeight: 54,
          paddingHorizontal: 18,
          paddingVertical: 14,
        },
        rowBorder: {
          borderBottomColor: colors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
        rowLabel: {
          color: colors.text,
          flex: 1,
          fontSize: 17,
          fontWeight: '600',
          letterSpacing: -0.2,
          marginRight: 12,
        },
        rowLabelDim: {
          color: colors.textMuted,
          fontWeight: '500',
        },
        triggerIconWrap: {
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 2,
          width: 24,
        },
        pickerWrap: {
          backgroundColor: useWheel ? 'transparent' : colors.shellElevated,
          paddingBottom: Platform.OS === 'ios' ? 8 : 4,
          paddingHorizontal: useWheel ? 0 : 4,
          width: '100%',
        },
        pickerIOS: {
          height: 200,
          width: '100%',
        },
      }),
    [colors, insets.bottom, pressed, useWheel],
  );

  const onSelect = useCallback(
    (v) => {
      onValueChange(v);
      setOpen(false);
    },
    [onValueChange],
  );

  return (
    <View style={[styles.field, fieldStyle]}>
      {label ? <AppText style={styles.fieldLabel}>{label}</AppText> : null}
      <Pressable
        accessibilityHint={
          useWheel ? 'Opens a picker to choose an option' : 'Opens a list of options'
        }
        accessibilityLabel={`${label ? `${label}. ` : ''}Currently ${selectedLabel ?? placeholder}. Tap to change.`}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onPress={() => setOpen(true)}
        style={({ pressed: pressedState }) => [styles.trigger, pressedState && { opacity: 0.9 }]}
      >
        <View style={[styles.triggerShell, triggerStyle]}>
          <AppText
            numberOfLines={1}
            style={[styles.triggerText, !selectedLabel && styles.triggerPlaceholder]}
          >
            {selectedLabel ?? placeholder}
          </AppText>
          <View style={styles.triggerIconWrap}>
            <Ionicons color={colors.textMuted} name="chevron-down" size={22} />
          </View>
        </View>
      </Pressable>

      <Modal
        animationType={useWheel ? 'slide' : 'fade'}
        onRequestClose={close}
        statusBarTranslucent
        transparent
        visible={open}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel={useWheel ? 'Dismiss picker' : 'Close list'}
            accessibilityRole="button"
            onPress={close}
            style={styles.backdrop}
          />
          <View
            style={[styles.sheetWrap, useWheel ? styles.sheetWrapWheel : styles.sheetWrapInset]}
          >
            <View style={[styles.sheet, useWheel && styles.sheetWheelBody]}>
              {!useWheel ? <View style={styles.grabber} /> : null}
              <View
                style={[
                  styles.sheetHeader,
                  useWheel ? styles.sheetHeaderWheel : styles.sheetHeaderInset,
                ]}
              >
                <AppText
                  accessibilityRole="header"
                  style={[styles.sheetTitle, useWheel && styles.sheetTitleWheel]}
                >
                  {sheetTitle}
                </AppText>
                {useWheel ? (
                  <Pressable
                    accessibilityLabel="Done"
                    accessibilityRole="button"
                    hitSlop={12}
                    onPress={close}
                    style={({ pressed }) => [styles.closeHit, pressed && { opacity: 0.6 }]}
                  >
                    <AppText style={styles.sheetDone}>Done</AppText>
                  </Pressable>
                ) : (
                  <Pressable
                    accessibilityLabel="Close"
                    accessibilityRole="button"
                    hitSlop={12}
                    onPress={close}
                    style={({ pressed }) => [styles.closeHit, pressed && { opacity: 0.6 }]}
                  >
                    <Ionicons color={colors.textMuted} name="close" size={26} />
                  </Pressable>
                )}
              </View>
              {useWheel ? (
                <View style={styles.pickerWrap}>
                  <Picker
                    dropdownIconColor={colors.textMuted}
                    itemStyle={
                      Platform.OS === 'ios'
                        ? {
                            color: colors.text,
                            fontSize: 20,
                            fontWeight: '600',
                          }
                        : undefined
                    }
                    mode={Platform.OS === 'ios' ? 'spinner' : 'dropdown'}
                    onValueChange={(itemValue) => {
                      if (itemValue === '') return;
                      onValueChange(String(itemValue));
                    }}
                    selectedValue={pickerSelectedValue}
                    style={Platform.OS === 'ios' ? styles.pickerIOS : { width: '100%' }}
                    themeVariant={isDark ? 'dark' : 'light'}
                  >
                    {options.map((opt) => (
                      <Picker.Item key={String(opt.value)} label={opt.label} value={opt.value} />
                    ))}
                  </Picker>
                </View>
              ) : (
                options.map((opt, index) => {
                  const selected = opt.value === value;
                  const isLast = index === options.length - 1;
                  return (
                    <Pressable
                      key={String(opt.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => onSelect(opt.value)}
                      style={({ pressed }) => [
                        styles.row,
                        !isLast && styles.rowBorder,
                        pressed && { backgroundColor: colors.buttonGhostPressed },
                      ]}
                    >
                      <AppText style={[styles.rowLabel, !selected && styles.rowLabelDim]}>
                        {opt.label}
                      </AppText>
                      {selected ? (
                        <Ionicons color={colors.tabBarActive} name="checkmark-circle" size={26} />
                      ) : (
                        <View style={{ height: 26, width: 26 }} />
                      )}
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
