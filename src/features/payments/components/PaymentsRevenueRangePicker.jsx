import Ionicons from '@expo/vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { REVENUE_RANGE, REVENUE_RANGE_OPTIONS } from '../constants/paymentsRevenueRanges';
import {
  formatRevenueCustomRangeLabel,
  isCompleteCustomRevenueRange,
} from '../utils/revenueDateWindows';
import { PaymentsRevenueCustomRangeForm } from './PaymentsRevenueCustomRangeSheet';

function resolveRangeId(id) {
  if (REVENUE_RANGE_OPTIONS.some((opt) => opt.id === id)) return id;
  return REVENUE_RANGE_OPTIONS[0]?.id ?? '';
}

/**
 * Compact time-range trigger + one sheet: small wheel, then expand for Custom.
 * Custom stays in the same overlay modal so iOS/Android do not drop a second sheet.
 *
 * @param {{
 *   value: string;
 *   customFromYmd?: string | null;
 *   customToYmd?: string | null;
 *   onChange: (id: string) => void;
 *   onSelectCustom: (next: { fromYmd: string; toYmd: string }) => void;
 * }} props
 */
export function PaymentsRevenueRangePicker({
  value,
  customFromYmd = null,
  customToYmd = null,
  onChange,
  onSelectCustom,
}) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(/** @type {'range' | 'custom'} */ ('range'));
  const [draft, setDraft] = useState(() => resolveRangeId(value));
  const [customCanView, setCustomCanView] = useState(false);
  const customConfirmRef = useRef(
    /** @type {(() => { fromYmd: string; toYmd: string } | null) | null} */ (null),
  );

  const selectedLabel =
    value === REVENUE_RANGE.CUSTOM
      ? formatRevenueCustomRangeLabel(customFromYmd, customToYmd)
      : (REVENUE_RANGE_OPTIONS.find((opt) => opt.id === value)?.label ?? 'Month');

  useEffect(() => {
    if (!open) return;
    setDraft(resolveRangeId(value));
    setStep('range');
  }, [open, value]);

  const close = useCallback(() => {
    setOpen(false);
    setStep('range');
  }, []);

  const goToCustom = useCallback(() => {
    setCustomCanView(isCompleteCustomRevenueRange(customFromYmd, customToYmd));
    setStep('custom');
  }, [customFromYmd, customToYmd]);

  const confirm = useCallback(() => {
    if (step === 'custom') {
      const next = customConfirmRef.current?.();
      if (!next) return;
      onSelectCustom?.(next);
      close();
      return;
    }

    const next = resolveRangeId(draft);
    if (next === REVENUE_RANGE.CUSTOM) {
      goToCustom();
      return;
    }
    if (next && next !== value) {
      onChange(next);
    }
    close();
  }, [close, draft, goToCustom, onChange, onSelectCustom, step, value]);

  const footerTitle =
    step === 'custom' ? 'View' : draft === REVENUE_RANGE.CUSTOM ? 'Pick dates' : 'View';

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
        {step === 'custom' ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.customScroll}
          >
            <PaymentsRevenueCustomRangeForm
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
              {REVENUE_RANGE_OPTIONS.map((opt) => (
                <Picker.Item key={opt.id} label={opt.label} value={opt.id} />
              ))}
            </Picker>
          </View>
        )}
      </BottomSheetModal>
    </>
  );
}
