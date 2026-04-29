import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { DEPOSIT_AMOUNT_MODE } from '../constants/depositAmount';

const TRACK_PAD = 4;
const BORDER = 1;
/** Outer control — matches deposit row height. */
const TRACK_W = 120;
const TRACK_H = 52;
/** Inner row fits inside track border + padding (explicit px — same pattern as `BookingsViewModeToggle`). */
const SEG_W = Math.floor((TRACK_W - 2 * BORDER - 2 * TRACK_PAD) / 2);
const SEG_H = TRACK_H - 2 * BORDER - 2 * TRACK_PAD;

/**
 * $ / % toggle. Uses **Pressable hit box + inner `View` both with fixed width/height** — RN `Pressable`
 * in a row often ignores width and collapses to text width (looks like `"$%"` in one corner).
 */
export function PaymentDepositUnitSegment({ value, onChange, disabled = false }) {
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        track: {
          alignItems: 'center',
          alignSelf: 'flex-start',
          /** Same face as `SurfaceCard` so the control sits flush with the deposits card. */
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 12,
          borderWidth: BORDER,
          flexDirection: 'row',
          flexShrink: 0,
          height: TRACK_H,
          justifyContent: 'flex-start',
          padding: TRACK_PAD,
          width: TRACK_W,
        },
        /** Outer tap target — explicit px (required). */
        segmentHit: {
          height: SEG_H,
          width: SEG_W,
        },
        /** Inner face — same px; centers glyph. */
        segmentFace: {
          alignItems: 'center',
          borderRadius: 8,
          borderWidth: 1,
          height: SEG_H,
          justifyContent: 'center',
          width: SEG_W,
        },
        faceInactive: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        },
        faceActive: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : colors.surface,
          borderColor: isDark ? 'rgba(255,255,255,0.28)' : colors.borderStrong,
        },
        glyph: {
          fontSize: 15,
          lineHeight: 18,
          textAlign: 'center',
          ...Platform.select({
            android: { includeFontPadding: false, textAlignVertical: 'center' },
            default: {},
          }),
        },
      }),
    [colors, isDark],
  );

  const fixedSelected = value === DEPOSIT_AMOUNT_MODE.FIXED;
  const pctSelected = value === DEPOSIT_AMOUNT_MODE.PERCENTAGE;

  const rippleFixed =
    disabled || Platform.OS !== 'android'
      ? undefined
      : { color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', borderless: false };
  const ripplePct =
    disabled || Platform.OS !== 'android'
      ? undefined
      : { color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', borderless: false };

  return (
    <View
      accessibilityLabel="Deposit amount type"
      accessibilityRole="radiogroup"
      style={[styles.track, disabled && { opacity: 0.45 }]}
    >
      <Pressable
        accessibilityLabel="Fixed dollar amount"
        accessibilityRole="radio"
        accessibilityState={{ disabled, selected: fixedSelected }}
        android_ripple={rippleFixed}
        disabled={disabled}
        hitSlop={4}
        style={({ pressed }) => [styles.segmentHit, !disabled && pressed && { opacity: 0.88 }]}
        onPress={() => onChange(DEPOSIT_AMOUNT_MODE.FIXED)}
      >
        <View style={[styles.segmentFace, fixedSelected ? styles.faceActive : styles.faceInactive]}>
          <AppText
            style={[
              styles.glyph,
              {
                color: fixedSelected ? colors.text : colors.textMuted,
                fontWeight: fixedSelected ? '700' : '600',
              },
            ]}
          >
            $
          </AppText>
        </View>
      </Pressable>
      <Pressable
        accessibilityLabel="Percentage of booking price"
        accessibilityRole="radio"
        accessibilityState={{ disabled, selected: pctSelected }}
        android_ripple={ripplePct}
        disabled={disabled}
        hitSlop={4}
        style={({ pressed }) => [styles.segmentHit, !disabled && pressed && { opacity: 0.88 }]}
        onPress={() => onChange(DEPOSIT_AMOUNT_MODE.PERCENTAGE)}
      >
        <View style={[styles.segmentFace, pctSelected ? styles.faceActive : styles.faceInactive]}>
          <AppText
            style={[
              styles.glyph,
              {
                color: pctSelected ? colors.text : colors.textMuted,
                fontWeight: pctSelected ? '700' : '600',
              },
            ]}
          >
            %
          </AppText>
        </View>
      </Pressable>
    </View>
  );
}
