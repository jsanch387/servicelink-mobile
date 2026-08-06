import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, FormBottomSheetModal, SurfaceTextField } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  DEFAULT_PLAN_CADENCE_KEY,
  formatCadenceLabel,
  formatOfferedCadencesLabel,
  PLAN_CADENCE_OPTIONS,
} from '../constants/planCadence';

function normalizePriceInput(rawText) {
  const input = String(rawText ?? '').replace(/\$/g, '');
  let out = '';
  let dotSeen = false;
  for (const ch of input) {
    if (ch >= '0' && ch <= '9') {
      out += ch;
      continue;
    }
    if (ch === '.' && !dotSeen) {
      out += ch;
      dotSeen = true;
    }
  }
  return out;
}

/**
 * Clean how-often multi-select dropdown component
 */
function HowOftenField({ selectedKeys, onChange }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const summary = formatOfferedCadencesLabel(selectedKeys);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: '100%',
        },
        label: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          marginBottom: 8,
        },
        triggerContainer: {
          position: 'relative',
          width: '100%',
        },
        trigger: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.inputBorder ?? colors.border,
          borderRadius: 16,
          borderWidth: 1,
          flexDirection: 'row',
          minHeight: 52,
          paddingHorizontal: 16,
          paddingRight: 48,
          width: '100%',
        },
        triggerExpanded: {
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
        },
        triggerText: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 16,
          fontWeight: '500',
          flex: 1,
        },
        chevron: {
          position: 'absolute',
          right: 16,
          top: '50%',
          marginTop: -9,
        },
        dropdown: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.inputBorder ?? colors.border,
          borderTopWidth: 0,
          borderWidth: 1,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          marginTop: -1,
          overflow: 'hidden',
          width: '100%',
        },
        option: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        checkbox: {
          alignItems: 'center',
          backgroundColor: 'transparent',
          borderColor: colors.borderStrong ?? colors.border,
          borderRadius: 4,
          borderWidth: 2,
          height: 20,
          justifyContent: 'center',
          marginRight: 12,
          width: 20,
        },
        checkboxSelected: {
          backgroundColor: colors.text,
          borderColor: colors.text,
        },
        optionText: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 16,
          fontWeight: '500',
          flex: 1,
        },
        separator: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginLeft: 48,
        },
      }),
    [colors],
  );

  const handleToggle = (key) => {
    const isSelected = selectedKeys.includes(key);
    let newSelection;

    if (isSelected) {
      // Don't allow deselecting if it's the only option
      if (selectedKeys.length === 1) {
        return;
      }
      newSelection = selectedKeys.filter((k) => k !== key);
    } else {
      newSelection = [...selectedKeys, key];
    }

    onChange(newSelection);
  };

  return (
    <View style={styles.container}>
      <AppText style={styles.label}>How often can they book?</AppText>

      <View style={styles.triggerContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.trigger,
            expanded && styles.triggerExpanded,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => setExpanded(!expanded)}
        >
          <AppText numberOfLines={1} style={styles.triggerText}>
            {summary}
          </AppText>
        </Pressable>

        <View style={styles.chevron} pointerEvents="none">
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textMuted}
          />
        </View>

        {expanded && (
          <View style={styles.dropdown}>
            {PLAN_CADENCE_OPTIONS.map((option, index) => {
              const isSelected = selectedKeys.includes(option.key);
              return (
                <View key={option.key}>
                  {index > 0 && <View style={styles.separator} />}
                  <Pressable
                    style={({ pressed }) => [
                      styles.option,
                      pressed && { backgroundColor: colors.surfaceElevated },
                    ]}
                    onPress={() => handleToggle(option.key)}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={12} color={colors.shell} />}
                    </View>
                    <AppText style={styles.optionText}>{option.label}</AppText>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * @param {object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onRequestClose
 * @param {(plan: {
 *   name: string;
 *   priceCents: number;
 *   offeredCadenceKeys: string[];
 *   serviceName: string;
 * }) => void | Promise<void>} props.onSubmit
 * @param {boolean} [props.submitting]
 */
export function SubscriptionsCreatePlanSheet({
  visible,
  onRequestClose,
  onSubmit,
  submitting = false,
}) {
  const [name, setName] = useState('');
  const [priceText, setPriceText] = useState('');
  const [offeredCadenceKeys, setOfferedCadenceKeys] = useState([DEFAULT_PLAN_CADENCE_KEY]);

  useEffect(() => {
    if (!visible) return;
    setName('');
    setPriceText('');
    setOfferedCadenceKeys([DEFAULT_PLAN_CADENCE_KEY]);
  }, [visible]);

  const priceCents = useMemo(() => {
    const n = Number.parseFloat(String(priceText).trim());
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n * 100);
  }, [priceText]);

  const canSubmit =
    String(name).trim().length > 0 &&
    priceCents != null &&
    offeredCadenceKeys.length > 0 &&
    !submitting;

  const stackStyles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          gap: 20,
          paddingBottom: 4,
        },
      }),
    [],
  );

  const handlePrimary = () => {
    if (!canSubmit || priceCents == null) return;
    void onSubmit({
      name: String(name).trim(),
      priceCents,
      offeredCadenceKeys: [...offeredCadenceKeys],
      serviceName: '',
    });
  };

  return (
    <FormBottomSheetModal
      primaryDisabled={!canSubmit}
      primaryLoading={submitting}
      primaryTitle="Save plan"
      title="New plan"
      visible={visible}
      onPrimaryPress={handlePrimary}
      onRequestClose={onRequestClose}
    >
      <View style={stackStyles.stack}>
        <SurfaceTextField
          autoCapitalize="words"
          compact
          containerStyle={{ marginBottom: 0 }}
          label="Plan name"
          placeholder="Monthly Wash"
          value={name}
          onChangeText={setName}
        />

        <SurfaceTextField
          compact
          containerStyle={{ marginBottom: 0 }}
          keyboardType="decimal-pad"
          label="Price"
          placeholder="100"
          prefixText="$"
          value={priceText}
          onChangeText={(t) => setPriceText(normalizePriceInput(t))}
        />

        <HowOftenField selectedKeys={offeredCadenceKeys} onChange={setOfferedCadenceKeys} />
      </View>
    </FormBottomSheetModal>
  );
}
