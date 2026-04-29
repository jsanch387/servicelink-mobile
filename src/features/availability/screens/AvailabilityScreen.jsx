import { useEffect, useMemo, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppText,
  Button,
  InlineCardError,
  SurfaceCard,
  TimeSelectField,
} from '../../../components/ui';
import { useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { TimeOffSheet } from '../components/TimeOffSheet';
import { useBusinessAvailability } from '../hooks/useBusinessAvailability';
import { useSaveBusinessAvailability } from '../hooks/useSaveBusinessAvailability';
import {
  buildWeeklySchedulePayloadFromUi,
  DAY_DEFINITIONS,
  format24HourTo12Hour,
  normalizeTimeOffBlocksForSave,
  to24Hour,
  validateTimeOffBlocks,
} from '../utils/availabilityModel';

function formatTimeOffDateDisplay(rawDate) {
  const raw = String(rawDate ?? '').trim();
  if (!raw) return 'Date';
  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function createTimeOffId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    // RFC 4122 v4 bits.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `block-${Date.now()}`;
}

export function AvailabilityScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const availability = useBusinessAvailability();
  const { saveAvailability, isSaving, saveError } = useSaveBusinessAvailability({
    businessId: availability.businessId,
  });
  const [isAcceptingRequests, setIsAcceptingRequests] = useState(false);
  const [isTimeOffSheetOpen, setIsTimeOffSheetOpen] = useState(false);
  const [dayTimeRanges, setDayTimeRanges] = useState(() => ({}));
  const [dayEnabledMap, setDayEnabledMap] = useState(() => ({}));
  const [timeOffBlocks, setTimeOffBlocks] = useState([]);

  useEffect(() => {
    const model = availability.model;
    setIsAcceptingRequests(model.acceptBookings);
    setDayEnabledMap(model.dayEnabledMap ?? {});
    setDayTimeRanges(model.dayTimeRanges ?? {});
    setTimeOffBlocks(Array.isArray(model.timeOffBlocks) ? model.timeOffBlocks : []);
  }, [availability.model]);

  function updateDayTime(day, key, nextValue) {
    setDayTimeRanges((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [key]: nextValue,
      },
    }));
  }

  const stickyBarHeight = 56;
  const scrollBottomPad = Math.max(insets.bottom, 16) + stickyBarHeight + 20;
  const hasChanges = useMemo(() => {
    const baseline = availability.model;
    const sameAccept = isAcceptingRequests === baseline.acceptBookings;
    const sameEnabledMap =
      JSON.stringify(dayEnabledMap ?? {}) === JSON.stringify(baseline.dayEnabledMap ?? {});
    const sameRanges =
      JSON.stringify(dayTimeRanges ?? {}) === JSON.stringify(baseline.dayTimeRanges ?? {});
    const sameTimeOff =
      JSON.stringify(timeOffBlocks ?? []) === JSON.stringify(baseline.timeOffBlocks ?? []);
    return !(sameAccept && sameEnabledMap && sameRanges && sameTimeOff);
  }, [availability.model, dayEnabledMap, dayTimeRanges, isAcceptingRequests, timeOffBlocks]);

  async function handleSave() {
    if (!availability.businessId) return;
    const normalizedTimeOff = normalizeTimeOffBlocksForSave(timeOffBlocks);
    const timeOffValidationError = validateTimeOffBlocks(normalizedTimeOff);
    if (timeOffValidationError) {
      Alert.alert('Could not save', safeUserFacingMessage(timeOffValidationError));
      return;
    }
    await saveAvailability({
      acceptBookings: isAcceptingRequests,
      selectedPreset: 'custom',
      weeklySchedule: buildWeeklySchedulePayloadFromUi(dayEnabledMap, dayTimeRanges),
      timeOffBlocks: normalizedTimeOff,
      minimumNotice: availability.row?.minimum_notice ?? 'none',
    });
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        content: {
          paddingBottom: scrollBottomPad,
          paddingHorizontal: 16,
          paddingTop: 18,
        },
        toggleCard: {
          borderRadius: 16,
          marginBottom: 14,
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        toggleRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        toggleTextWrap: {
          flex: 1,
          paddingRight: 12,
        },
        toggleTitle: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '700',
          marginBottom: 6,
        },
        toggleHint: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
        },
        sectionTitle: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
          marginBottom: 8,
          marginTop: 4,
        },
        sectionTitleSpaced: {
          marginTop: 14,
        },
        scheduleCard: {
          borderRadius: 16,
          paddingHorizontal: 0,
          paddingVertical: 0,
        },
        dayRow: {
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          paddingHorizontal: 14,
          paddingVertical: 10,
        },
        dayRowLast: {
          borderBottomWidth: 0,
        },
        dayHeaderRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        dayShort: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '700',
        },
        dayDetailRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          marginTop: 10,
        },
        timeRangeWrap: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          width: '100%',
        },
        timeSelectCell: {
          flex: 1,
          minWidth: 0,
        },
        timeSelectTrigger: {
          borderRadius: 10,
          minHeight: 38,
          paddingHorizontal: 8,
        },
        toText: {
          color: colors.text,
          fontSize: 12,
          fontWeight: '600',
        },
        unavailableText: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
        },
        timeOffCard: {
          borderRadius: 16,
          overflow: 'hidden',
          paddingHorizontal: 0,
          paddingVertical: 0,
        },
        timeOffHeader: {
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        timeOffSubtext: {
          color: colors.textMuted,
          fontSize: 13,
          textAlign: 'left',
        },
        timeOffAddButton: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.borderStrong,
          borderRadius: 14,
          borderWidth: 1,
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 14,
          minHeight: 52,
        },
        timeOffAddText: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '700',
          marginLeft: 8,
        },
        timeOffEmpty: {
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 130,
          paddingHorizontal: 14,
          paddingVertical: 20,
        },
        timeOffEmptyText: {
          color: colors.textMuted,
          fontSize: 18,
          fontWeight: '500',
        },
        timeOffList: {
          paddingHorizontal: 0,
          paddingVertical: 8,
        },
        timeOffItem: {
          alignItems: 'center',
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 10,
        },
        timeOffItemLast: {
          borderBottomWidth: 0,
        },
        timeOffItemInfo: {
          flex: 1,
          minWidth: 0,
          paddingLeft: 2,
          paddingRight: 12,
        },
        timeOffItemDate: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '700',
          marginBottom: 4,
        },
        timeOffItemTime: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
        },
        timeOffDeleteButton: {
          alignItems: 'center',
          alignSelf: 'center',
          height: 30,
          justifyContent: 'center',
          width: 30,
        },
        saveBar: {
          bottom: Math.max(insets.bottom - 12, 0),
          left: 16,
          position: 'absolute',
          right: 16,
        },
      }),
    [colors, insets.bottom, scrollBottomPad],
  );

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {availability.businessError ? (
          <SurfaceCard style={{ marginBottom: 10 }}>
            <InlineCardError message={availability.businessError} />
          </SurfaceCard>
        ) : null}
        {availability.availabilityError ? (
          <SurfaceCard style={{ marginBottom: 10 }}>
            <InlineCardError message={availability.availabilityError} />
          </SurfaceCard>
        ) : null}
        <SurfaceCard style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <AppText style={styles.toggleTitle}>Accept booking requests</AppText>
              <AppText style={styles.toggleHint}>
                {isAcceptingRequests
                  ? 'Turn this off to stop accepting appointments.'
                  : 'Turn this on to start accepting appointments.'}
              </AppText>
            </View>
            <Switch
              onValueChange={setIsAcceptingRequests}
              thumbColor={isAcceptingRequests ? '#f8fafc' : '#f4f4f5'}
              trackColor={{ false: colors.borderStrong, true: '#10b981' }}
              value={isAcceptingRequests}
            />
          </View>
        </SurfaceCard>

        <AppText style={styles.sectionTitle}>Weekly schedule</AppText>
        <SurfaceCard style={styles.scheduleCard}>
          {DAY_DEFINITIONS.map((entry, index) => (
            <View
              key={entry.key}
              style={[styles.dayRow, index === DAY_DEFINITIONS.length - 1 && styles.dayRowLast]}
            >
              <View style={styles.dayHeaderRow}>
                <AppText style={styles.dayShort}>{entry.label}</AppText>
                <Switch
                  thumbColor="#f8fafc"
                  trackColor={{ false: colors.borderStrong, true: '#10b981' }}
                  value={Boolean(dayEnabledMap[entry.label])}
                  onValueChange={(next) => {
                    setDayEnabledMap((prev) => ({ ...prev, [entry.label]: next }));
                  }}
                />
              </View>
              <View style={styles.dayDetailRow}>
                {Boolean(dayEnabledMap[entry.label]) ? (
                  <View style={styles.timeRangeWrap}>
                    <View style={styles.timeSelectCell}>
                      <TimeSelectField
                        placeholder="Start"
                        title={`${entry.label} start time`}
                        triggerStyle={styles.timeSelectTrigger}
                        value={dayTimeRanges[entry.label]?.start ?? ''}
                        onValueChange={(next) => updateDayTime(entry.label, 'start', next)}
                      />
                    </View>
                    <AppText style={styles.toText}>to</AppText>
                    <View style={styles.timeSelectCell}>
                      <TimeSelectField
                        placeholder="End"
                        title={`${entry.label} end time`}
                        triggerStyle={styles.timeSelectTrigger}
                        value={dayTimeRanges[entry.label]?.end ?? ''}
                        onValueChange={(next) => updateDayTime(entry.label, 'end', next)}
                      />
                    </View>
                  </View>
                ) : (
                  <AppText style={styles.unavailableText}>Unavailable</AppText>
                )}
              </View>
            </View>
          ))}
        </SurfaceCard>

        <AppText style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Time off</AppText>
        <SurfaceCard style={styles.timeOffCard}>
          <View style={styles.timeOffHeader}>
            <AppText style={styles.timeOffSubtext}>
              Block times when you can&apos;t take bookings.
            </AppText>
            <Pressable style={styles.timeOffAddButton} onPress={() => setIsTimeOffSheetOpen(true)}>
              <Ionicons color={colors.text} name="add" size={26} />
              <AppText style={styles.timeOffAddText}>Add</AppText>
            </Pressable>
          </View>
          {timeOffBlocks.length === 0 ? (
            <View style={styles.timeOffEmpty}>
              <AppText style={styles.timeOffEmptyText}>No time off scheduled.</AppText>
            </View>
          ) : (
            <View style={styles.timeOffList}>
              {timeOffBlocks.map((block, index) => (
                <View
                  key={`${block?.date ?? 'date'}-${index}`}
                  style={[
                    styles.timeOffItem,
                    index === timeOffBlocks.length - 1 && styles.timeOffItemLast,
                  ]}
                >
                  <View style={styles.timeOffItemInfo}>
                    <AppText style={styles.timeOffItemDate}>
                      {formatTimeOffDateDisplay(block?.date)}
                    </AppText>
                    <AppText style={styles.timeOffItemTime}>
                      {format24HourTo12Hour(block?.start_time) ?? '--'} -{' '}
                      {format24HourTo12Hour(block?.end_time) ?? '--'}
                    </AppText>
                  </View>
                  <Pressable
                    accessibilityLabel="Delete time off"
                    accessibilityRole="button"
                    style={styles.timeOffDeleteButton}
                    onPress={() =>
                      setTimeOffBlocks((prev) => prev.filter((_, itemIdx) => itemIdx !== index))
                    }
                  >
                    <Ionicons color="#f87171" name="trash-outline" size={20} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </SurfaceCard>
        <TimeOffSheet
          visible={isTimeOffSheetOpen}
          onAddTimeOff={(block) => {
            const normalizedStart = to24Hour(block?.start_time ?? block?.startTime);
            const normalizedEnd = to24Hour(block?.end_time ?? block?.endTime);
            const nextBlock = {
              id: createTimeOffId(),
              date: String(block?.date ?? '').trim(),
              start_time: normalizedStart,
              end_time: normalizedEnd,
              title: String(block?.title ?? '').trim() || undefined,
            };
            setTimeOffBlocks((prev) => [...prev, nextBlock]);
          }}
          onRequestClose={() => setIsTimeOffSheetOpen(false)}
        />
      </ScrollView>
      <View style={styles.saveBar}>
        <Button
          disabled={!hasChanges || isSaving || availability.isLoading}
          fullWidth
          loading={isSaving}
          title={isSaving ? 'Saving…' : 'Save changes'}
          variant="surfaceLight"
          onPress={() => {
            void handleSave();
          }}
        />
      </View>
      {saveError ? (
        <View
          style={{
            backgroundColor: 'rgba(127,29,29,0.9)',
            borderRadius: 10,
            bottom: Math.max(insets.bottom, 12) + 60,
            left: 16,
            paddingHorizontal: 12,
            paddingVertical: 8,
            position: 'absolute',
            right: 16,
          }}
        >
          <AppText style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>
            {saveError}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
