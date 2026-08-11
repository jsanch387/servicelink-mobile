import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText, normalizeCustomJobPriceInput, SurfaceTextField } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  cadenceKeyFromParts,
  clampCadenceCount,
  formatCustomCadenceLabel,
  formatSchedulePriceLine,
  isPresetCadence,
  normalizeCadenceInterval,
  PLAN_CADENCE_PRESETS,
} from '../constants/planCadence';
import { CustomCadenceField } from './CustomCadenceField';

/** @typedef {{ count: number; interval: 'week' | 'month'; priceText: string; custom?: boolean }} PlanSchedule */

function keyOf(schedule) {
  return cadenceKeyFromParts(schedule?.count, schedule?.interval);
}

function priceCentsOf(priceText) {
  const n = Number.parseFloat(String(priceText ?? '').trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function emptyDraft(takenKeys = new Set()) {
  const free = PLAN_CADENCE_PRESETS.find((preset) => !takenKeys.has(preset.key));
  if (free) {
    return { count: free.count, interval: free.interval, custom: false, priceText: '' };
  }
  return { count: 1, interval: /** @type {'week'} */ ('week'), custom: true, priceText: '' };
}

/**
 * Composer + list: pick how often, set a price, Add — then it lands in the list below.
 *
 * @param {object} props
 * @param {PlanSchedule[]} props.value — confirmed options
 * @param {(next: PlanSchedule[]) => void} props.onChange
 * @param {number} [props.maxSchedules]
 */
export function PlanScheduleField({ value, onChange, maxSchedules = 3 }) {
  const { colors } = useTheme();
  const schedules = Array.isArray(value) ? value : [];
  const takenKeys = new Set(schedules.map(keyOf));

  const [draft, setDraft] = useState(() => emptyDraft());

  const draftKey = keyOf(draft);
  const draftInterval = normalizeCadenceInterval(draft.interval);
  const draftCount = clampCadenceCount(draft.count, draftInterval);
  const inCustomMode = Boolean(draft.custom) || !isPresetCadence(draftCount, draftInterval);
  const draftPriceCents = priceCentsOf(draft.priceText);
  const draftTaken = takenKeys.has(draftKey);
  const atCap = schedules.length >= maxSchedules;
  const canAdd = !atCap && draftPriceCents != null && !draftTaken;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        chipRow: {
          flexDirection: 'row',
          gap: 8,
        },
        chip: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 12,
          borderWidth: 1,
          flexDirection: 'row',
          flexGrow: 1,
          flexShrink: 1,
          gap: 5,
          height: 46,
          justifyContent: 'center',
          minWidth: 0,
          paddingHorizontal: 8,
        },
        chipOn: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
        chipOff: {
          opacity: 0.35,
        },
        chipLabel: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
        chipLabelOn: {
          color: colors.shell,
        },
        customBlock: {
          marginTop: 14,
        },
        priceRow: {
          alignItems: 'flex-end',
          flexDirection: 'row',
          gap: 10,
          marginTop: 18,
        },
        priceField: {
          flex: 1,
          marginBottom: 0,
          minWidth: 0,
        },
        addBtn: {
          alignItems: 'center',
          backgroundColor: '#ffffff',
          borderColor: 'rgba(10, 10, 10, 0.12)',
          borderRadius: 16,
          borderWidth: 1,
          height: 52,
          justifyContent: 'center',
          minWidth: 92,
          opacity: canAdd ? 1 : 0.45,
          paddingHorizontal: 18,
        },
        addLabel: {
          color: '#000000',
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          fontWeight: '600',
        },
        list: {
          marginTop: 22,
        },
        listLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          marginBottom: 8,
        },
        listCard: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          overflow: 'hidden',
        },
        listRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
          minHeight: 56,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        listDivider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginLeft: 14,
        },
        listMain: {
          flex: 1,
          minWidth: 0,
        },
        listTitle: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        listSub: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          marginTop: 2,
        },
        removeHit: {
          alignItems: 'center',
          height: 36,
          justifyContent: 'center',
          width: 36,
        },
      }),
    [canAdd, colors],
  );

  const selectPreset = (preset) => {
    void Haptics.selectionAsync().catch(() => {});
    setDraft((prev) => ({
      ...prev,
      count: preset.count,
      interval: preset.interval,
      custom: false,
    }));
  };

  const addSchedule = () => {
    if (!canAdd) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const next = [
      ...schedules,
      {
        count: draftCount,
        interval: draftInterval,
        priceText: draft.priceText,
        custom: inCustomMode,
      },
    ];
    onChange(next);
    setDraft(emptyDraft(new Set(next.map(keyOf))));
  };

  const removeAt = (index) => {
    void Haptics.selectionAsync().catch(() => {});
    const next = schedules.filter((_, i) => i !== index);
    onChange(next);
    // If the draft was a taken duplicate of something still listed, leave it;
    // if we freed the draft's cadence, keep the draft so they can re-add.
    setDraft((prev) => {
      const nextTaken = new Set(next.map(keyOf));
      if (!nextTaken.has(keyOf(prev)) && String(prev.priceText).trim()) return prev;
      if (String(prev.priceText).trim()) return prev;
      return emptyDraft(nextTaken);
    });
  };

  return (
    <View>
      {!atCap ? (
        <View>
          <View style={styles.chipRow}>
            {PLAN_CADENCE_PRESETS.map((preset) => {
              const isActive = !inCustomMode && preset.key === draftKey;
              const isTaken = takenKeys.has(preset.key);
              return (
                <TouchableOpacity
                  accessibilityLabel={formatCustomCadenceLabel(preset.count, preset.interval)}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isTaken, selected: isActive }}
                  activeOpacity={0.85}
                  disabled={isTaken}
                  key={preset.key}
                  style={[styles.chip, isActive && styles.chipOn, isTaken && styles.chipOff]}
                  onPress={() => selectPreset(preset)}
                >
                  <AppText
                    numberOfLines={1}
                    style={[styles.chipLabel, isActive && styles.chipLabelOn]}
                  >
                    {preset.shortLabel}
                  </AppText>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              accessibilityLabel="Custom schedule"
              accessibilityRole="button"
              accessibilityState={{ selected: inCustomMode }}
              activeOpacity={0.85}
              style={[styles.chip, inCustomMode && styles.chipOn]}
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setDraft((prev) => ({ ...prev, custom: true }));
              }}
            >
              <Ionicons
                color={inCustomMode ? colors.shell : colors.text}
                name="options-outline"
                size={14}
              />
              <AppText
                numberOfLines={1}
                style={[styles.chipLabel, inCustomMode && styles.chipLabelOn]}
              >
                Custom
              </AppText>
            </TouchableOpacity>
          </View>

          {inCustomMode ? (
            <View style={styles.customBlock}>
              <CustomCadenceField
                count={draftCount}
                interval={draftInterval}
                takenKeys={takenKeys}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    ...next,
                    custom: true,
                  }))
                }
              />
            </View>
          ) : null}

          <View style={styles.priceRow}>
            <SurfaceTextField
              compact
              containerStyle={styles.priceField}
              keyboardType="decimal-pad"
              label="Price"
              placeholder="20"
              prefixText="$"
              value={draft.priceText}
              onChangeText={(text) =>
                setDraft((prev) => ({
                  ...prev,
                  priceText: normalizeCustomJobPriceInput(text),
                }))
              }
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ disabled: !canAdd }}
              activeOpacity={0.85}
              disabled={!canAdd}
              style={styles.addBtn}
              onPress={addSchedule}
            >
              <AppText style={styles.addLabel}>Add</AppText>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {schedules.length > 0 ? (
        <View style={styles.list}>
          <AppText style={styles.listLabel}>
            {schedules.length === 1 ? 'Your option' : 'Your options'}
          </AppText>
          <View style={styles.listCard}>
            {schedules.map((schedule, index) => {
              const cents = priceCentsOf(schedule.priceText);
              return (
                <View key={`${keyOf(schedule)}-${index}`}>
                  {index > 0 ? <View style={styles.listDivider} /> : null}
                  <View style={styles.listRow}>
                    <View style={styles.listMain}>
                      <AppText style={styles.listTitle}>
                        {formatCustomCadenceLabel(schedule.count, schedule.interval)}
                      </AppText>
                      <AppText style={styles.listSub}>
                        {formatSchedulePriceLine(cents, schedule.count, schedule.interval)}
                      </AppText>
                    </View>
                    <TouchableOpacity
                      accessibilityLabel={`Remove ${formatCustomCadenceLabel(schedule.count, schedule.interval)}`}
                      accessibilityRole="button"
                      activeOpacity={0.6}
                      hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
                      style={styles.removeHit}
                      onPress={() => removeAt(index)}
                    >
                      <Ionicons color={colors.textMuted} name="close" size={20} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}
