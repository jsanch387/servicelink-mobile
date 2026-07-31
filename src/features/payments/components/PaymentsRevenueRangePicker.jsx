import Ionicons from '@expo/vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { REVENUE_RANGE_OPTIONS } from '../constants/paymentsRevenueRanges';

function resolveRangeId(id) {
  if (REVENUE_RANGE_OPTIONS.some((opt) => opt.id === id)) return id;
  return REVENUE_RANGE_OPTIONS[0]?.id ?? '';
}

/**
 * Compact time-range trigger + fitContent wheel sheet (same pattern as SelectField `wheel`).
 * Wheel changes stay local until View is pressed.
 *
 * @param {{
 *   value: string;
 *   onChange: (id: string) => void;
 * }} props
 */
export function PaymentsRevenueRangePicker({ value, onChange }) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => resolveRangeId(value));

  const selectedLabel = REVENUE_RANGE_OPTIONS.find((opt) => opt.id === value)?.label ?? 'Month';

  useEffect(() => {
    if (open) {
      setDraft(resolveRangeId(value));
    }
  }, [open, value]);

  const close = useCallback(() => setOpen(false), []);

  const confirm = useCallback(() => {
    const next = resolveRangeId(draft);
    if (next && next !== value) {
      onChange(next);
    }
    setOpen(false);
  }, [draft, onChange, value]);

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
          paddingHorizontal: 11,
          paddingVertical: 7,
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
          <AppText numberOfLines={1} style={styles.triggerLabel}>
            {selectedLabel}
          </AppText>
          <Ionicons color={colors.textMuted} name="chevron-down" size={14} />
        </View>
      </Pressable>

      <BottomSheetModal
        allowBackdropClose
        fitContent
        footer={
          <View style={styles.footer}>
            <Button fullWidth title="View" variant="primary" onPress={confirm} />
          </View>
        }
        showCloseButton={false}
        title="Time range"
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
      </BottomSheetModal>
    </>
  );
}
