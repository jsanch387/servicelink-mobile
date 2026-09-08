import Ionicons from '@expo/vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { BottomSheetModal } from './BottomSheetModal';
import { Button } from './Button';
import { CustomDateRangeForm } from './CustomDateRangeForm';
import { formatCustomDateRangeLabel, isCompleteCustomDateRange } from './customDateRange';

const DEFAULT_CUSTOM_KEY = 'custom';

function resolveRangeKey(value, options) {
  if (options.some((opt) => opt.key === value)) return value;
  return options[0]?.key ?? '';
}

/**
 * Compact time-range trigger + wheel sheet. Optional Custom step uses the same overlay
 * (do not mount a second modal).
 *
 * @param {{
 *   value: string;
 *   options: Array<{ key: string; label: string }>;
 *   onChange: (key: string) => void;
 *   customKey?: string;
 *   customFromYmd?: string | null;
 *   customToYmd?: string | null;
 *   onSelectCustom?: (next: { fromYmd: string; toYmd: string }) => void;
 * }} props
 */
export function TimeRangePicker({
  value,
  options,
  onChange,
  customKey = DEFAULT_CUSTOM_KEY,
  customFromYmd = null,
  customToYmd = null,
  onSelectCustom,
}) {
  const { colors, isDark } = useTheme();
  const allowsCustom = Boolean(onSelectCustom) && options.some((opt) => opt.key === customKey);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(/** @type {'range' | 'custom'} */ ('range'));
  const [draft, setDraft] = useState(() => resolveRangeKey(value, options));
  const [customCanView, setCustomCanView] = useState(false);
  const customConfirmRef = useRef(
    /** @type {(() => { fromYmd: string; toYmd: string } | null) | null} */ (null),
  );

  const selectedLabel =
    allowsCustom && value === customKey
      ? formatCustomDateRangeLabel(customFromYmd, customToYmd)
      : (options.find((opt) => opt.key === value)?.label ?? options[0]?.label ?? '');

  useEffect(() => {
    if (!open) return;
    setDraft(resolveRangeKey(value, options));
    setStep('range');
  }, [open, options, value]);

  const close = useCallback(() => {
    setOpen(false);
    setStep('range');
  }, []);

  const goToCustom = useCallback(() => {
    setCustomCanView(isCompleteCustomDateRange(customFromYmd, customToYmd));
    setStep('custom');
  }, [customFromYmd, customToYmd]);

  const confirm = useCallback(() => {
    if (allowsCustom && step === 'custom') {
      const next = customConfirmRef.current?.();
      if (!next) return;
      onSelectCustom?.(next);
      close();
      return;
    }

    const next = resolveRangeKey(draft, options);
    if (allowsCustom && next === customKey) {
      goToCustom();
      return;
    }
    if (next && next !== value) {
      onChange(next);
    }
    close();
  }, [
    allowsCustom,
    close,
    customKey,
    draft,
    goToCustom,
    onChange,
    onSelectCustom,
    options,
    step,
    value,
  ]);

  const footerTitle =
    allowsCustom && step === 'custom'
      ? 'View'
      : allowsCustom && draft === customKey
        ? 'Pick dates'
        : 'View';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        trigger: {
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: isDark ? colors.surface : colors.shell,
          borderColor: colors.border,
          borderRadius: 10,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 4,
          maxWidth: 156,
          paddingHorizontal: 11,
          paddingVertical: 7,
        },
        triggerLabelCol: {
          flexShrink: 1,
          minWidth: 0,
        },
        chevronCol: {
          alignItems: 'center',
          justifyContent: 'center',
          width: 14,
        },
        triggerLabel: {
          color: colors.text,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: -0.05,
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
        footer: {
          marginTop: 4,
        },
        footerCustom: {
          marginTop: 22,
        },
        customScroll: {
          maxHeight: Math.round(Dimensions.get('window').height * 0.58),
        },
      }),
    [colors, isDark],
  );

  return (
    <>
      <Pressable
        accessibilityHint="Opens a picker to choose a time range"
        accessibilityLabel={`Time range: ${selectedLabel}. Tap to change.`}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }]}
      >
        <View style={styles.trigger}>
          <View style={styles.triggerLabelCol}>
            <AppText numberOfLines={1} style={styles.triggerLabel}>
              {selectedLabel}
            </AppText>
          </View>
          <View style={styles.chevronCol}>
            <Ionicons color={colors.textMuted} name="chevron-down" size={14} />
          </View>
        </View>
      </Pressable>

      <BottomSheetModal
        allowBackdropClose
        fitContent
        footer={
          <View style={[styles.footer, step === 'custom' && styles.footerCustom]}>
            <Button
              disabled={step === 'custom' && !customCanView}
              fullWidth
              title={footerTitle}
              variant="primary"
              onPress={confirm}
            />
          </View>
        }
        showCloseButton
        title={step === 'custom' ? 'Custom range' : 'Time range'}
        visible={open}
        onRequestClose={close}
      >
        {allowsCustom && step === 'custom' ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.customScroll}
          >
            <CustomDateRangeForm
              active={open && step === 'custom'}
              initialFromYmd={customFromYmd}
              initialToYmd={customToYmd}
              onCanViewChange={setCustomCanView}
              onConfirmRef={customConfirmRef}
            />
          </ScrollView>
        ) : (
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
              selectedValue={draft}
              style={Platform.OS === 'ios' ? styles.pickerIOS : { width: '100%' }}
              themeVariant={isDark ? 'dark' : 'light'}
              onValueChange={(itemValue) => {
                if (itemValue === '') return;
                setDraft(String(itemValue));
              }}
            >
              {options.map((opt) => (
                <Picker.Item key={opt.key} label={opt.label} value={opt.key} />
              ))}
            </Picker>
          </View>
        )}
      </BottomSheetModal>
    </>
  );
}
