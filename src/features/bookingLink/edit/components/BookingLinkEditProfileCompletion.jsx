import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

const RING_SIZE = 28;
const STROKE_WIDTH = 2;
const CHECKMARK_SIZE = 12;
const CHEVRON_SIZE = 13;

/** Warm yellow for high-but-incomplete progress (not in theme tokens). */
const PROGRESS_HIGH = '#eab308';

function getCompletionProgressTone(percent, colors) {
  if (percent >= 100) {
    return { ring: colors.timelineCompletedFill, text: colors.textSuccess };
  }
  if (percent >= 70) {
    return { ring: PROGRESS_HIGH, text: PROGRESS_HIGH };
  }
  if (percent >= 40) {
    return { ring: colors.notificationBellDot, text: colors.notificationBellDot };
  }
  return { ring: colors.danger, text: colors.danger };
}

function getCompletionSubtitle(percent) {
  if (percent >= 100) {
    return 'All set';
  }
  if (percent >= 75) {
    return 'Almost done';
  }
  if (percent >= 40) {
    return 'A few items left';
  }
  return 'Getting started';
}

/**
 * Profile completion header for booking-link edit mode.
 */
export function BookingLinkEditProfileCompletion({ percent = 0, onPress }) {
  const { colors } = useTheme();
  const clampedPercent = Math.max(0, Math.min(100, Math.round(percent)));
  const isComplete = clampedPercent >= 100;

  const radius = (RING_SIZE - STROKE_WIDTH) / 2;
  const center = RING_SIZE / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clampedPercent / 100);

  const { ring: progressColor, text: percentColor } = getCompletionProgressTone(
    clampedPercent,
    colors,
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        shell: {
          alignSelf: 'stretch',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          minHeight: 44,
          paddingBottom: 12,
          paddingTop: 0,
        },
        ringWrap: {
          alignItems: 'center',
          height: RING_SIZE,
          justifyContent: 'center',
          width: RING_SIZE,
        },
        ringIcon: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'center',
        },
        copy: {
          flex: 1,
          minWidth: 0,
        },
        titleRow: {
          alignItems: 'center',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 5,
        },
        title: {
          color: colors.textSecondary,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: -0.05,
        },
        percent: {
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: -0.05,
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '400',
          letterSpacing: 0,
          lineHeight: 14,
          marginTop: 1,
        },
        chevron: {
          marginLeft: 2,
          opacity: 0.45,
        },
        divider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          width: '100%',
        },
      }),
    [colors],
  );

  const content = (
    <>
      <View style={styles.ringWrap}>
        <Svg height={RING_SIZE} width={RING_SIZE}>
          <Circle
            cx={center}
            cy={center}
            fill="none"
            r={radius}
            stroke={colors.borderStrong}
            strokeWidth={STROKE_WIDTH}
          />
          <Circle
            cx={center}
            cy={center}
            fill="none"
            r={radius}
            stroke={progressColor}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={isComplete ? 0 : strokeDashoffset}
            strokeLinecap="round"
            strokeWidth={STROKE_WIDTH}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>
        {isComplete ? (
          <View style={styles.ringIcon}>
            <Ionicons color={progressColor} name="checkmark" size={CHECKMARK_SIZE} />
          </View>
        ) : null}
      </View>

      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <AppText style={styles.title}>Profile completion</AppText>
          <AppText style={[styles.percent, { color: percentColor }]}>{clampedPercent}%</AppText>
        </View>
        <AppText style={styles.subtitle}>{getCompletionSubtitle(clampedPercent)}</AppText>
      </View>

      <Ionicons
        color={colors.textMuted}
        name="chevron-forward"
        size={CHEVRON_SIZE}
        style={styles.chevron}
      />
    </>
  );

  if (onPress) {
    return (
      <View style={styles.shell}>
        <Pressable
          accessibilityHint="Opens profile completion details"
          accessibilityLabel={`Profile completion ${clampedPercent} percent`}
          accessibilityRole="button"
          style={styles.row}
          onPress={onPress}
        >
          {content}
        </Pressable>
        <View style={styles.divider} />
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <View style={styles.row}>{content}</View>
      <View style={styles.divider} />
    </View>
  );
}
