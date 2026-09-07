import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';

const BAR_HEIGHT = 4;
const BAR_GAP = 6;

/**
 * Top onboarding stepper: “Step n of m” and five pill segments (current only highlighted).
 */
export function OnboardingProgressStepper({ currentIndex, totalSteps = 5 }) {
  const { colors, isDark } = useTheme();

  const styles = useMemo(() => {
    const inactiveBar = isDark ? 'rgba(255,255,255,0.12)' : colors.borderStrong;
    const activeBar = colors.text;
    return StyleSheet.create({
      root: {
        alignSelf: 'stretch',
        marginBottom: 16,
      },
      stepOf: {
        color: colors.textMuted,
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 0.1,
        marginBottom: 10,
        textAlign: 'left',
      },
      barsRow: {
        flexDirection: 'row',
        gap: BAR_GAP,
      },
      segment: {
        borderRadius: 999,
        flex: 1,
        height: BAR_HEIGHT,
      },
      segmentActive: {
        backgroundColor: activeBar,
      },
      segmentInactive: {
        backgroundColor: inactiveBar,
      },
    });
  }, [colors, isDark]);

  return (
    <View style={styles.root}>
      <AppText style={styles.stepOf}>
        Step {currentIndex + 1} of {totalSteps}
      </AppText>
      <View style={styles.barsRow}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View
            key={String(i)}
            style={[
              styles.segment,
              i === currentIndex ? styles.segmentActive : styles.segmentInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}
