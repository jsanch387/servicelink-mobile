import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { BottomSheetModal } from './BottomSheetModal';
import { Button } from './Button';
import { useModalFadeBackdropSlideSheet } from './useModalFadeBackdropSlideSheet';

/**
 * Opens a bottom sheet to pick one option. Trigger matches {@link TextField} outline styling.
 * Layout: full-screen backdrop (dismiss) + sheet only at the bottom (so touches work reliably).
 *
 * `presentation`: `sheet` (default) = scrollable rows; `wheel` = native picker in a compact
 * app bottom sheet (same chrome as {@link BottomSheetModal} `fitContent`, not a full page sheet).
 * Web uses `sheet`.
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

  const { prepareOpen, runOpen, runClose, backdropStyle, sheetStyle } =
    useModalFadeBackdropSlideSheet();

  const close = useCallback(() => {
    if (useWheel) {
      setOpen(false);
      return;
    }
    runClose(() => setOpen(false));
  }, [runClose, useWheel]);

  useEffect(() => {
    if (!open || useWheel) return undefined;
    const id = requestAnimationFrame(() => runOpen());
    return () => cancelAnimationFrame(id);
  }, [open, runOpen, useWheel]);

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
        sheet: {
          backgroundColor: colors.shellElevated,
          borderColor: colors.borderStrong,
          borderRadius: 20,
          borderWidth: 1,
          overflow: 'hidden',
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
          paddingBottom: 14,
          paddingHorizontal: 18,
          paddingTop: 4,
        },
        sheetTitle: {
          color: colors.text,
          flex: 1,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.35,
          marginRight: 12,
        },
        closeHit: {
          padding: 4,
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
          textAlign: 'left',
        },
        rowLabelDim: {
          color: colors.textMuted,
          fontWeight: '500',
          textAlign: 'left',
        },
        triggerIconWrap: {
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 2,
          width: 24,
        },
        pickerWrap: {
          marginHorizontal: -4,
          paddingBottom: Platform.OS === 'ios' ? 4 : 0,
          width: '100%',
        },
        pickerIOS: {
          height: 200,
          width: '100%',
        },
        wheelFooter: {
          marginTop: 4,
        },
      }),
    [colors, insets.bottom, pressed],
  );

  const onSelect = useCallback(
    (v) => {
      onValueChange(v);
      runClose(() => setOpen(false));
    },
    [onValueChange, runClose],
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
        onPress={() => {
          if (!useWheel) prepareOpen();
          setOpen(true);
        }}
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

      {useWheel ? (
        <BottomSheetModal
          allowBackdropClose
          fitContent
          footer={
            <View style={styles.wheelFooter}>
              <Button fullWidth title="Done" variant="primary" onPress={close} />
            </View>
          }
          showCloseButton={false}
          title={sheetTitle}
          visible={open}
          onRequestClose={close}
        >
          <View style={styles.pickerWrap}>
            <Picker
              dropdownIconColor={colors.textMuted}
              itemStyle={
                Platform.OS === 'ios'
                  ? {
                      color: colors.text,
                      fontSize: 20,
                      fontWeight: '600',
                      textAlign: 'left',
                    }
                  : undefined
              }
              mode={Platform.OS === 'ios' ? 'spinner' : 'dropdown'}
              selectedValue={pickerSelectedValue}
              style={Platform.OS === 'ios' ? styles.pickerIOS : { width: '100%' }}
              themeVariant={isDark ? 'dark' : 'light'}
              onValueChange={(itemValue) => {
                if (itemValue === '') return;
                onValueChange(String(itemValue));
              }}
            >
              {options.map((opt) => (
                <Picker.Item key={String(opt.value)} label={opt.label} value={opt.value} />
              ))}
            </Picker>
          </View>
        </BottomSheetModal>
      ) : (
        <Modal
          animationType="none"
          statusBarTranslucent
          transparent
          visible={open}
          onRequestClose={close}
        >
          <View style={styles.modalRoot}>
            <Animated.View
              pointerEvents="box-none"
              style={[
                StyleSheet.absoluteFillObject,
                backdropStyle,
                { backgroundColor: 'rgba(0,0,0,0.55)' },
              ]}
            >
              <Pressable
                accessibilityLabel="Close list"
                accessibilityRole="button"
                style={StyleSheet.absoluteFillObject}
                onPress={close}
              />
            </Animated.View>
            <Animated.View style={[styles.sheetWrap, styles.sheetWrapInset, sheetStyle]}>
              <View style={styles.sheet}>
                <View style={styles.grabber} />
                <View style={styles.sheetHeader}>
                  <AppText accessibilityRole="header" style={styles.sheetTitle}>
                    {sheetTitle}
                  </AppText>
                  <Pressable
                    accessibilityLabel="Close"
                    accessibilityRole="button"
                    hitSlop={12}
                    style={({ pressed: closePressed }) => [
                      styles.closeHit,
                      closePressed && { opacity: 0.6 },
                    ]}
                    onPress={close}
                  >
                    <Ionicons color={colors.textMuted} name="close" size={26} />
                  </Pressable>
                </View>
                {options.map((opt, index) => {
                  const selected = opt.value === value;
                  const isLast = index === options.length - 1;
                  return (
                    <Pressable
                      key={String(opt.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      style={({ pressed: rowPressed }) => [
                        styles.row,
                        !isLast && styles.rowBorder,
                        rowPressed && { backgroundColor: colors.buttonGhostPressed },
                      ]}
                      onPress={() => onSelect(opt.value)}
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
                })}
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}
