import { useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, InlineCardError, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { AvailabilityScreenSkeleton } from '../components/AvailabilityScreenSkeleton';
import { LeadTimeSection } from '../components/LeadTimeSection';
import { TimeOffSection } from '../components/TimeOffSection';
import { TimeOffSheet } from '../components/TimeOffSheet';
import { WeeklyScheduleSection } from '../components/WeeklyScheduleSection';
import { useBusinessAvailability } from '../hooks/useBusinessAvailability';
import { useSaveBusinessAvailability } from '../hooks/useSaveBusinessAvailability';
import {
  buildWeeklySchedulePayloadFromUi,
  dayEnabledMapHasAtLeastOneEnabled,
  normalizeMinimumNotice,
  normalizeTimeOffBlocksForSave,
  to24Hour,
  validateTimeOffBlocks,
} from '../utils/availabilityModel';

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
  const {
    refetch: refetchAvailability,
    isFetching: availabilityIsFetching,
    isLoading: availabilityIsLoading,
  } = availability;

  const availabilityRefreshControl = useMemo(
    () => (
      <RefreshControl
        colors={[colors.accent]}
        onRefresh={() => void refetchAvailability()}
        refreshing={Boolean(availabilityIsFetching && !availabilityIsLoading)}
        tintColor={colors.accent}
      />
    ),
    [availabilityIsFetching, availabilityIsLoading, colors.accent, refetchAvailability],
  );
  const { saveAvailability, isSaving, saveError } = useSaveBusinessAvailability({
    businessId: availability.businessId,
  });
  const [isAcceptingRequests, setIsAcceptingRequests] = useState(false);
  const [isTimeOffSheetOpen, setIsTimeOffSheetOpen] = useState(false);
  const [dayTimeRanges, setDayTimeRanges] = useState(() => ({}));
  const [dayEnabledMap, setDayEnabledMap] = useState(() => ({}));
  const [timeOffBlocks, setTimeOffBlocks] = useState([]);
  const [schedulePreset, setSchedulePreset] = useState('mon_fri_9_5');
  const [minimumNotice, setMinimumNotice] = useState('none');

  useEffect(() => {
    const model = availability.model;
    const hasActiveDay = dayEnabledMapHasAtLeastOneEnabled(model.dayEnabledMap ?? {});
    setIsAcceptingRequests(Boolean(hasActiveDay && model.acceptBookings));
    setDayEnabledMap(model.dayEnabledMap ?? {});
    setDayTimeRanges(model.dayTimeRanges ?? {});
    setTimeOffBlocks(Array.isArray(model.timeOffBlocks) ? model.timeOffBlocks : []);
    setSchedulePreset(model.selectedPreset ?? 'mon_fri_9_5');
    setMinimumNotice(normalizeMinimumNotice(model.minimumNotice));
  }, [availability.model]);

  const hasActiveDay = useMemo(
    () => dayEnabledMapHasAtLeastOneEnabled(dayEnabledMap),
    [dayEnabledMap],
  );

  function handleDayToggle(day, next) {
    setSchedulePreset('custom');
    setDayEnabledMap((prev) => {
      const merged = { ...prev, [day]: next };
      if (!dayEnabledMapHasAtLeastOneEnabled(merged)) {
        setIsAcceptingRequests(false);
      }
      return merged;
    });
  }

  function handleDayTimeChange(day, key, nextValue) {
    setSchedulePreset('custom');
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
    const samePreset = schedulePreset === (baseline.selectedPreset ?? 'mon_fri_9_5');
    const sameNotice =
      normalizeMinimumNotice(minimumNotice) ===
      normalizeMinimumNotice(baseline.minimumNotice ?? 'none');
    return !(sameAccept && samePreset && sameEnabledMap && sameRanges && sameTimeOff && sameNotice);
  }, [
    availability.model,
    dayEnabledMap,
    dayTimeRanges,
    isAcceptingRequests,
    minimumNotice,
    schedulePreset,
    timeOffBlocks,
  ]);

  async function handleSave() {
    if (!availability.businessId) return;
    const normalizedTimeOff = normalizeTimeOffBlocksForSave(timeOffBlocks);
    const timeOffValidationError = validateTimeOffBlocks(normalizedTimeOff);
    if (timeOffValidationError) {
      Alert.alert('Could not save', safeUserFacingMessage(timeOffValidationError));
      return;
    }
    await saveAvailability({
      acceptBookings: dayEnabledMapHasAtLeastOneEnabled(dayEnabledMap) && isAcceptingRequests,
      selectedPreset: schedulePreset,
      weeklySchedule: buildWeeklySchedulePayloadFromUi(dayEnabledMap, dayTimeRanges),
      timeOffBlocks: normalizedTimeOff,
      minimumNotice: normalizeMinimumNotice(minimumNotice),
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
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={availabilityRefreshControl}
        showsVerticalScrollIndicator={false}
      >
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
        {availability.businessError || availability.availabilityError ? (
          <Button
            accessibilityHint="Attempts to load availability again"
            accessibilityLabel="Try again"
            fullWidth
            loading={Boolean(availabilityIsFetching && !availabilityIsLoading)}
            style={{ marginBottom: 14 }}
            title="Try again"
            variant="secondary"
            onPress={() => void refetchAvailability()}
          />
        ) : null}
        {availability.isLoading ? (
          <AvailabilityScreenSkeleton />
        ) : (
          <>
            <SurfaceCard style={styles.toggleCard}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextWrap}>
                  <AppText style={styles.toggleTitle}>Accept booking requests</AppText>
                  <AppText style={styles.toggleHint}>
                    {!hasActiveDay
                      ? 'Turn on at least one day below before you can accept booking requests.'
                      : isAcceptingRequests
                        ? 'Turn this off to stop accepting appointments.'
                        : 'Turn this on to start accepting appointments.'}
                  </AppText>
                </View>
                <Switch
                  accessibilityLabel="Accept booking requests"
                  disabled={!hasActiveDay && !isAcceptingRequests}
                  onValueChange={(next) => {
                    if (next && !dayEnabledMapHasAtLeastOneEnabled(dayEnabledMap)) return;
                    setIsAcceptingRequests(next);
                  }}
                  thumbColor={isAcceptingRequests ? '#f8fafc' : '#f4f4f5'}
                  trackColor={{ false: colors.borderStrong, true: '#10b981' }}
                  value={isAcceptingRequests}
                />
              </View>
            </SurfaceCard>

            <WeeklyScheduleSection
              dayEnabledMap={dayEnabledMap}
              dayTimeRanges={dayTimeRanges}
              style={{ marginBottom: 0 }}
              onDayTimeChange={handleDayTimeChange}
              onDayToggle={handleDayToggle}
            />

            <TimeOffSection
              blocks={timeOffBlocks}
              onAddPress={() => setIsTimeOffSheetOpen(true)}
              onDeletePress={(index) =>
                setTimeOffBlocks((prev) => prev.filter((_, itemIdx) => itemIdx !== index))
              }
            />

            <LeadTimeSection value={minimumNotice} onValueChange={setMinimumNotice} />
          </>
        )}
        <TimeOffSheet
          visible={isTimeOffSheetOpen}
          onAddTimeOff={(block) => {
            const allDay = Boolean(block?.all_day ?? block?.allDay);
            const normalizedStart = allDay
              ? '00:00'
              : to24Hour(block?.start_time ?? block?.startTime);
            const normalizedEnd = allDay ? '23:59' : to24Hour(block?.end_time ?? block?.endTime);
            const startDate = String(block?.start_date ?? block?.date ?? '').trim();
            const endDate = String(block?.end_date ?? startDate).trim();
            const nextBlock = {
              id: createTimeOffId(),
              start_date: startDate,
              end_date: endDate,
              ...(startDate === endDate ? { date: startDate } : {}),
              all_day: allDay,
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
