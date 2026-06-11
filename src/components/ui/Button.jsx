import { useMemo } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
 * `outline` (transparent + 2px border by default, uses `outlineColor` or theme text), and `danger`.
 * Use `outlineThin` for a 1px outline (e.g. muted border + primary label via `labelColor`).
 * Optional `outlineBg` adds a tone behind outline pills (pair with `outlineBgPressed` or defaults to `buttonSecondaryBgPressed`).
 * `iconLibrary` selects the icon set for `iconName` (default Ionicons; use `material-community` for other glyphs).
 * When `iconNode` is set, it is shown instead of `iconName` / `iconLibrary` for that side.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  /** When false, disabled buttons keep full label/icon opacity (e.g. sent-state CTAs). */
  subduedWhenDisabled = true,
  loading = false,
  /** Custom node shown in place of the default spinner while `loading` (e.g. EchoBarsLoader). */
  loadingNode = null,
  fullWidth = false,
  /** Squarer corners (e.g. paired row actions) — overrides default 14px radius. */
  squared = false,
  /** When `variant="outline"`, use 1px border instead of 2px. */
  outlineThin = false,
  /** Fills the outline face; when set, default press state is `buttonSecondaryBgPressed` unless `outlineBgPressed` is set. */
  outlineBg,
  outlineBgPressed,
  outlineColor,
  iconName,
  /** `'ionicons'` (default) or `'material-community'` for `iconName`. */
  iconLibrary = 'ionicons',
  /** Renders instead of `iconName` when set (custom icon node). */
  iconNode = null,
  iconPosition = 'left',
  iconSize = 18,
  iconColor,
  labelColor,
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
        let disabledFaceStyle = null;

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
          disabledFaceStyle = [
            {
              backgroundColor: '#a1a1aa',
              borderColor: SURFACE_LIGHT_BORDER,
            },
          ];
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
          const fill = outlineBg ?? 'transparent';
          const fillPressed =
            outlineBgPressed != null
              ? outlineBgPressed
              : outlineBg
                ? colors.buttonSecondaryBgPressed
                : 'transparent';
          faceStyle = [
            styles.face,
            outlineThin ? styles.faceBorder : styles.faceOutlineBold,
            styles.faceStrokeInset,
            {
              backgroundColor: pressed ? fillPressed : fill,
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

        const resolvedTextColor =
          disabled && !loading && variant === 'surfaceLight'
            ? '#3f3f46'
            : (labelColor ?? textColor);

        const resolvedIconColor = iconColor ?? resolvedTextColor;
        const renderIcon = (position) => {
          if (!iconName) return null;
          const iconStyle = position === 'left' ? styles.iconLeft : styles.iconRight;
          if (iconLibrary === 'material-community') {
            return (
              <MaterialCommunityIcons
                color={resolvedIconColor}
                name={iconName}
                size={iconSize}
                style={iconStyle}
              />
            );
          }
          return (
            <Ionicons color={resolvedIconColor} name={iconName} size={iconSize} style={iconStyle} />
          );
        };

        const showLeftIcon = iconNode && iconPosition === 'left';
        const showRightIcon = iconNode && iconPosition === 'right';
        const showLeftNamed = !showLeftIcon && iconName && iconPosition === 'left';
        const showRightNamed = !showRightIcon && iconName && iconPosition === 'right';

        const contentChildren = (
          <>
            {showLeftIcon ? <View style={styles.iconLeft}>{iconNode}</View> : null}
            {showLeftNamed ? renderIcon('left') : null}
            <AppText
              ellipsizeMode="tail"
              numberOfLines={1}
              style={[styles.label, { color: resolvedTextColor }]}
            >
              {title}
            </AppText>
            {showRightIcon ? <View style={styles.iconRight}>{iconNode}</View> : null}
            {showRightNamed ? renderIcon('right') : null}
          </>
        );

        return (
          <View
            style={[
              faceStyle,
              squared && styles.faceSquared,
              disabled && !loading && subduedWhenDisabled && (disabledFaceStyle ?? styles.busy),
            ]}
          >
            {loading ? (
              <View
                collapsable={false}
                style={[styles.loadingShell, fullWidth && styles.loadingShellFullWidth]}
              >
                {/* Invisible resting content preserves exact button footprint. */}
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={styles.contentReserved}
                >
                  <View style={styles.contentRow}>{contentChildren}</View>
                </View>
                <View collapsable={false} pointerEvents="none" style={styles.loadingOverlay}>
                  {loadingNode ?? <ActivityIndicator color={spinnerColor} />}
                </View>
              </View>
            ) : (
              <View style={styles.contentRow}>{contentChildren}</View>
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
  faceSquared: {
    borderRadius: 10,
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
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  contentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  loadingShell: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  loadingShellFullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  /** Resting content kept in flow but invisible so loading never resizes the button. */
  contentReserved: {
    opacity: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
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
