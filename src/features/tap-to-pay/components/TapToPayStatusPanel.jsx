import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, EchoBarsLoader } from '../../../components/ui';
import { useTheme } from '../../../theme';
import {
  TAP_TO_PAY_STATUS_SLOT_MIN_HEIGHT,
  TAP_TO_PAY_STATUS_STAGE_MIN_HEIGHT,
  TAP_TO_PAY_VISUAL_STAGE_HEIGHT,
} from '../constants/tapToPayLayout';
import { TapToPayPulseVisual } from './TapToPayPulseVisual';

/**
 * Shared preparing / processing / error visual for booking and walk-up Tap to Pay.
 *
 * @param {{
 *   isLoadingVisual: boolean;
 *   isLoadingIntent?: boolean;
 *   isProcessing?: boolean;
 *   phase: string;
 *   statusLine?: string | null;
 * }} props
 */
export function TapToPayStatusPanel({
  isLoadingVisual,
  isLoadingIntent = false,
  isProcessing = false,
  phase,
  statusLine = null,
}) {
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        statusPanel: {
          alignItems: 'center',
          backgroundColor: 'transparent',
          borderColor: isDark ? 'rgba(255,255,255,0.14)' : colors.border,
          borderRadius: 18,
          borderWidth: 1,
          gap: 4,
          justifyContent: 'center',
          marginTop: 24,
          minHeight: TAP_TO_PAY_STATUS_STAGE_MIN_HEIGHT + 40,
          paddingHorizontal: 20,
          paddingVertical: 28,
          width: '100%',
        },
        loadingCluster: {
          alignItems: 'center',
          gap: 12,
          justifyContent: 'center',
          width: '100%',
        },
        visualBlock: {
          alignItems: 'center',
          height: TAP_TO_PAY_VISUAL_STAGE_HEIGHT,
          justifyContent: 'center',
          width: '100%',
        },
        statusSlot: {
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -10,
          minHeight: TAP_TO_PAY_STATUS_SLOT_MIN_HEIGHT,
          paddingHorizontal: 4,
          width: '100%',
        },
        statusLine: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.1,
          textAlign: 'center',
        },
      }),
    [colors, isDark],
  );

  const loaderLabel = isLoadingIntent
    ? 'Preparing payment'
    : isProcessing
      ? 'Processing payment'
      : 'Opening Tap to Pay';

  return (
    <View style={styles.statusPanel}>
      {isLoadingVisual ? (
        <View style={styles.loadingCluster}>
          <EchoBarsLoader accessibilityLabel={loaderLabel} color={colors.text} size="large" />
          {statusLine && !isLoadingIntent ? (
            <AppText style={styles.statusLine}>{statusLine}</AppText>
          ) : null}
        </View>
      ) : (
        <>
          <View style={styles.visualBlock}>
            <TapToPayPulseVisual
              accentColor={colors.text}
              phase={phase === 'success' ? 'success' : 'error'}
            />
          </View>
          {statusLine && !isLoadingIntent ? (
            <View style={styles.statusSlot}>
              <AppText style={styles.statusLine}>{statusLine}</AppText>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
