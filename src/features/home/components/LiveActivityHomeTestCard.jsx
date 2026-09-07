import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, SlideToStartJob, SpotlightCard, useToast } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { ElapsedJobTimer } from '../../bookings/live-activity/ElapsedJobTimer';
import { NextUpLivePulse } from './NextUpLivePulse';
import {
  endJobLiveActivity,
  startJobLiveActivity,
} from '../../bookings/live-activity/jobLiveActivity';
import { LIVE_ACTIVITY_HOME_TEST_BOOKING } from '../constants/liveActivityHomeTestFlags';

function startFailureMessage(result) {
  if (result?.reason === 'module_missing') {
    return 'This build is missing Live Activities. Rebuild with npx expo run:ios --device.';
  }
  if (result?.reason === 'disabled') {
    return 'Turn on Live Activities in Settings → ServiceLink.';
  }
  return result?.message || 'Could not start the island timer.';
}

/**
 * Local Next Up stand-in so we can exercise Live Activities without SMS or a scheduled job.
 */
export function LiveActivityHomeTestCard() {
  const { colors } = useTheme();
  const toast = useToast();
  const [started, setStarted] = useState(false);
  const [startedAtMs, setStartedAtMs] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleStart = useCallback(async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      const result = await startJobLiveActivity(LIVE_ACTIVITY_HOME_TEST_BOOKING);
      if (!result?.ok) {
        toast.error(startFailureMessage(result));
        return;
      }
      setStarted(true);
      setStartedAtMs(result.startedAtMs ?? Date.now());
    } finally {
      setBusy(false);
    }
  }, [busy, toast]);

  const handleDone = useCallback(async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await endJobLiveActivity(LIVE_ACTIVITY_HOME_TEST_BOOKING.id);
      setStarted(false);
      setStartedAtMs(null);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return (
    <SpotlightCard accessibilityLabel="Island test next up" collapsable={false} style={styles.card}>
      <View style={styles.body}>
        {started ? (
          <View style={styles.inProgressHeader}>
            <View style={styles.nameRow}>
              <View style={styles.nameCol}>
                <AppText
                  ellipsizeMode="tail"
                  numberOfLines={2}
                  style={[styles.customerName, { color: colors.nextUpText }]}
                >
                  {LIVE_ACTIVITY_HOME_TEST_BOOKING.customer_name}
                </AppText>
              </View>
              <View style={styles.inProgressMetaCol}>
                <NextUpLivePulse
                  stacked
                  color={colors.nextUpSurface === '#ffffff' ? '#059669' : '#34d399'}
                />
              </View>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusLabelCol}>
                <AppText
                  numberOfLines={1}
                  style={[styles.statusLabel, { color: colors.nextUpTextMuted }]}
                >
                  In progress
                </AppText>
              </View>
              <View style={styles.inProgressMetaCol}>
                <ElapsedJobTimer color={colors.nextUpTextMuted} startedAtMs={startedAtMs} />
              </View>
            </View>
          </View>
        ) : (
          <>
            <AppText
              ellipsizeMode="tail"
              numberOfLines={2}
              style={[styles.customerName, { color: colors.nextUpText }]}
            >
              {LIVE_ACTIVITY_HOME_TEST_BOOKING.customer_name}
            </AppText>
            <AppText
              ellipsizeMode="tail"
              numberOfLines={1}
              style={[styles.subtitle, { color: colors.nextUpTextMuted }]}
            >
              No SMS — island test only
            </AppText>
          </>
        )}
        <AppText
          ellipsizeMode="tail"
          numberOfLines={1}
          style={[styles.service, { color: colors.nextUpText }]}
        >
          {LIVE_ACTIVITY_HOME_TEST_BOOKING.service_name}
        </AppText>
      </View>
      <View style={styles.actions}>
        {started ? (
          <Button
            accessibilityHint="Stops the Dynamic Island timer and resets this test card"
            accessibilityLabel="Done"
            disabled={busy}
            fullWidth
            iconName="checkmark-done-outline"
            loading={busy}
            title="Done"
            variant="surfaceDark"
            onPress={() => {
              void handleDone();
            }}
          />
        ) : (
          <SlideToStartJob loading={busy} surfaceTone="light" onComplete={handleStart} />
        )}
      </View>
    </SpotlightCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
  },
  body: {
    alignSelf: 'stretch',
    minWidth: 0,
    width: '100%',
  },
  inProgressHeader: {
    alignSelf: 'stretch',
    width: '100%',
  },
  nameRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 3,
    width: '100%',
  },
  statusLabelCol: {
    flex: 1,
    minWidth: 0,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.02,
    lineHeight: 19,
  },
  inProgressMetaCol: {
    alignItems: 'center',
    flexShrink: 0,
    minWidth: 40,
    overflow: 'visible',
  },
  customerName: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.55,
    lineHeight: 29,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
    marginTop: 3,
  },
  service: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 21,
    marginTop: 14,
  },
  actions: {
    marginTop: 26,
    width: '100%',
  },
});
