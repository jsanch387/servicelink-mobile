import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

/**
 * Opens a bottom sheet to pick one option. Trigger matches {@link TextField} outline styling.
 * Layout: full-screen backdrop (dismiss) + sheet only at the bottom (so touches work reliably).
 *
 * @param {{
 *   label?: string;
 *   title?: string;
 *   placeholder?: string;
 *   options: { value: string; label: string }[];
 *   value: string | null | undefined;
 *   onValueChange: (value: string) => void;
 * }} props
 */
export function SelectField({
  label,
  title,
  placeholder = 'Select',
  options,
  value,
  onValueChange,
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    const hit = options.find((o) => o.value === value);
    return hit?.label ?? null;
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
          alignItems: 'center',
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
          borderRadius: 14,
          borderWidth: 1.5,
          flexDirection: 'row',
          justifyContent: 'space-between',
          minHeight: 52,
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        triggerText: {
          color: colors.inputText,
          flex: 1,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
          marginRight: 10,
          minWidth: 0,
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
          backgroundColor: 'rgba(0,0,0,0.55)',
        },
        sheetWrap: {
          bottom: 0,
          left: 0,
          paddingBottom: Math.max(insets.bottom, 14) + 8,
          paddingHorizontal: 16,
          position: 'absolute',
          right: 0,
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
        },
        rowLabelDim: {
          color: colors.textMuted,
          fontWeight: '500',
        },
      }),
    [colors, insets.bottom],
  );

  const onSelect = useCallback(
    (v) => {
      onValueChange(v);
      setOpen(false);
    },
    [onValueChange],
  );

  return (
    <View style={styles.field}>
      {label ? <AppText style={styles.fieldLabel}>{label}</AppText> : null}
      <Pressable
        accessibilityHint="Opens a list of options"
        accessibilityLabel={`${label ? `${label}. ` : ''}Currently ${selectedLabel ?? placeholder}. Tap to change.`}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && { opacity: 0.9 }]}
      >
        <AppText
          numberOfLines={1}
          style={[styles.triggerText, !selectedLabel && styles.triggerPlaceholder]}
        >
          {selectedLabel ?? placeholder}
        </AppText>
        <Ionicons color={colors.textMuted} name="chevron-down" size={22} />
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
        transparent
        visible={open}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="Close list"
            accessibilityRole="button"
            onPress={close}
            style={styles.backdrop}
          />
          <View style={styles.sheetWrap}>
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
                  onPress={close}
                  style={({ pressed }) => [styles.closeHit, pressed && { opacity: 0.6 }]}
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
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
