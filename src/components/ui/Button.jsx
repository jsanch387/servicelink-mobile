import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

/** Primary: white background, black text (tokens + explicit fallbacks so layout always paints). */
const PRIMARY_BG = '#ffffff';
const PRIMARY_BG_PRESSED = '#e5e5e5';
const PRIMARY_TEXT = '#000000';

const SURFACE_LIGHT_BORDER = 'rgba(10, 10, 10, 0.12)';
const SURFACE_DARK_BG = '#0a0a0a';
const SURFACE_DARK_BG_PRESSED = '#262626';
const SURFACE_LIGHT_TEXT = '#000000';
const SURFACE_DARK_TEXT = '#ffffff';
const DANGER_TEXT = '#ffffff';

/**
 * Shared button — theme `primary` / `secondary` / `ghost`, plus fixed high-contrast pairs for
 * hero surfaces (e.g. Next up card): `surfaceLight` (white + black), `surfaceDark` (black + white),
 * `outline` (transparent + 2px border, uses `outlineColor` or theme text), and `danger`.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  outlineColor,
  iconName,
  iconPosition = 'left',
  iconSize = 18,
  iconColor,
  style,
  ...rest
}) {
  const { colors } = useTheme();
  const isBusy = disabled || loading;
  const outlineTint = outlineColor ?? colors.text;

  const spinnerColor = useMemo(() => {
    if (variant === 'primary') return colors.spinnerOnPrimary ?? PRIMARY_TEXT;
    if (variant === 'secondary') return colors.spinnerOnSecondary;
    if (variant === 'surfaceLight') return SURFACE_LIGHT_TEXT;
    if (variant === 'surfaceDark') return SURFACE_DARK_TEXT;
    if (variant === 'outline') return outlineTint;
    if (variant === 'danger') return DANGER_TEXT;
    return colors.accent;
  }, [colors, variant, outlineTint]);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isBusy}
      onPress={onPress}
      style={[fullWidth && styles.fullWidth, style]}
      {...rest}
    >
      {({ pressed }) => {
        let faceStyle = styles.face;
        let textColor = colors.text;

        if (variant === 'primary') {
          faceStyle = [
            styles.face,
            {
              backgroundColor: pressed
                ? (colors.buttonPrimaryBgPressed ?? PRIMARY_BG_PRESSED)
                : (colors.buttonPrimaryBg ?? PRIMARY_BG),
            },
          ];
          textColor = colors.buttonPrimaryText ?? PRIMARY_TEXT;
        } else if (variant === 'secondary') {
          faceStyle = [
            styles.face,
            {
              backgroundColor: pressed ? colors.buttonSecondaryBgPressed : colors.buttonSecondaryBg,
            },
          ];
          textColor = colors.buttonSecondaryText;
        } else if (variant === 'surfaceLight') {
          faceStyle = [
            styles.face,
            styles.faceBorder,
            styles.faceStrokeInset,
            {
              backgroundColor: pressed ? PRIMARY_BG_PRESSED : PRIMARY_BG,
              borderColor: SURFACE_LIGHT_BORDER,
            },
          ];
          textColor = SURFACE_LIGHT_TEXT;
        } else if (variant === 'surfaceDark') {
          faceStyle = [
            styles.face,
            styles.faceOutlineBold,
            styles.faceStrokeInset,
            {
              backgroundColor: pressed ? SURFACE_DARK_BG_PRESSED : SURFACE_DARK_BG,
              borderColor: 'transparent',
            },
          ];
          textColor = SURFACE_DARK_TEXT;
        } else if (variant === 'outline') {
          faceStyle = [
            styles.face,
            styles.faceOutlineBold,
            styles.faceStrokeInset,
            {
              backgroundColor: 'transparent',
              borderColor: outlineTint,
            },
          ];
          textColor = outlineTint;
        } else if (variant === 'danger') {
          faceStyle = [
            styles.face,
            {
              backgroundColor: pressed ? 'rgba(185, 28, 28, 0.95)' : colors.danger,
            },
          ];
          textColor = DANGER_TEXT;
        } else {
          faceStyle = [
            styles.face,
            {
              backgroundColor: pressed ? colors.buttonGhostPressed : 'transparent',
            },
          ];
          textColor = colors.accent;
        }

        return (
          <View style={[faceStyle, isBusy && styles.busy]}>
            {loading ? (
              <ActivityIndicator color={spinnerColor} />
            ) : (
              <View style={styles.contentRow}>
                {iconName && iconPosition === 'left' ? (
                  <Ionicons
                    color={iconColor ?? textColor}
                    name={iconName}
                    size={iconSize}
                    style={styles.iconLeft}
                  />
                ) : null}
                <AppText style={[styles.label, { color: textColor }]}>{title}</AppText>
                {iconName && iconPosition === 'right' ? (
                  <Ionicons
                    color={iconColor ?? textColor}
                    name={iconName}
                    size={iconSize}
                    style={styles.iconRight}
                  />
                ) : null}
              </View>
            )}
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  face: {
    alignItems: 'center',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 52,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  faceBorder: {
    borderWidth: 1,
  },
  faceOutlineBold: {
    borderWidth: 2,
  },
  /** Border strokes add visual bulk; inset keeps parity beside filled buttons. */
  faceStrokeInset: {
    minHeight: 50,
    paddingVertical: 14,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  contentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  busy: {
    opacity: 0.55,
  },
});
