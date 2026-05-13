import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { AppTextInput } from './AppTextInput';
import { SurfaceInputRow, useSurfaceInputTextStyle } from './SurfaceInputRow';

/**
 * Labeled input inside the same `cardSurface` shell as the customers search bar.
 * Optional `showPasswordToggle` adds an eye icon to reveal / hide text (`secureTextEntry`).
 * Optional `rightAccessory` adds a trailing node (e.g. calendar); ignored when `showPasswordToggle` is true.
 * Optional `onShellPress` wraps the input row in a pressable (e.g. date field + calendar). Use with `editable={false}` so taps reach the shell.
 * Optional `errorText` — small red line under the row (takes precedence over `helperText` for visibility).
 * Optional `helperText` — muted hint under the row (hidden when `errorText` is set).
 * `label` may be a string or a React node (e.g. custom label styling).
 * Ref is forwarded to the inner `TextInput` (e.g. focus chaining).
 */
export const SurfaceTextField = forwardRef(function SurfaceTextField(
  {
    label,
    leftIcon,
    errorText,
    helperText,
    showPasswordToggle = false,
    /** Trailing slot inside the row (e.g. icon button). Ignored when `showPasswordToggle` is true. */
    rightAccessory = null,
    /** When set, the whole input row is tappable (e.g. date field + calendar). */
    onShellPress,
    value,
    onChangeText,
    placeholder,
    secureTextEntry: secureTextEntryProp,
    containerStyle,
    maxLength: maxLengthProp,
    /** Tighter vertical rhythm for dense forms (e.g. create-appointment). */
    compact = false,
    ...rest
  },
  ref,
) {
  const { style: restInputStyle, maxLength: maxLengthFromRest, ...inputRest } = rest;
  const maxLength = maxLengthProp ?? maxLengthFromRest;
  const { colors } = useTheme();
  const inputTextStyle = useSurfaceInputTextStyle();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  const secureTextEntry = showPasswordToggle ? !passwordVisible : (secureTextEntryProp ?? false);
  const hasError = Boolean(errorText?.trim());

  const styles = useMemo(
    () =>
      StyleSheet.create({
        field: {
          marginBottom: compact ? 12 : 20,
        },
        labelWrap: {
          marginBottom: compact ? 6 : 8,
        },
        labelText: {
          fontSize: 14,
          fontWeight: '500',
        },
        rowShell: {
          borderColor: hasError
            ? colors.danger
            : focused
              ? colors.borderStrong
              : colors.inputBorder,
          borderWidth: focused || hasError ? 1.5 : 1,
        },
        iconPad: {
          marginRight: 2,
        },
        toggleHit: {
          alignItems: 'center',
          height: 40,
          justifyContent: 'center',
          marginLeft: 2,
          width: 40,
        },
        helperLine: {
          fontSize: 12,
          fontWeight: '500',
          lineHeight: 16,
          marginTop: 6,
        },
      }),
    [colors, compact, focused, hasError],
  );

  const leftNode =
    leftIcon != null ? (
      <View style={styles.iconPad}>
        <Ionicons color={colors.textMuted} name={leftIcon} size={18} />
      </View>
    ) : null;

  const rightNode = showPasswordToggle ? (
    <Pressable
      accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
      accessibilityRole="button"
      hitSlop={8}
      style={styles.toggleHit}
      onPress={() => setPasswordVisible((v) => !v)}
    >
      <Ionicons
        color={colors.textMuted}
        name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
        size={20}
      />
    </Pressable>
  ) : (
    rightAccessory
  );

  const inputRow = (
    <SurfaceInputRow left={leftNode} right={rightNode} style={styles.rowShell}>
      <AppTextInput
        ref={ref}
        {...inputRest}
        pointerEvents={onShellPress ? 'none' : inputRest.pointerEvents}
        onBlur={(e) => {
          setFocused(false);
          inputRest.onBlur?.(e);
        }}
        onChangeText={onChangeText}
        onFocus={(e) => {
          setFocused(true);
          inputRest.onFocus?.(e);
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={secureTextEntry}
        style={[inputTextStyle, restInputStyle]}
        value={value}
        maxLength={maxLength}
      />
    </SurfaceInputRow>
  );

  return (
    <View style={[styles.field, containerStyle]}>
      {label != null ? (
        <View style={styles.labelWrap}>
          {typeof label === 'string' ? (
            <AppText style={[styles.labelText, { color: colors.textMuted }]}>{label}</AppText>
          ) : (
            label
          )}
        </View>
      ) : null}
      {onShellPress ? (
        <Pressable accessibilityRole="button" onPress={onShellPress}>
          {inputRow}
        </Pressable>
      ) : (
        inputRow
      )}
      {hasError ? (
        <AppText
          accessibilityLiveRegion="polite"
          style={[styles.helperLine, { color: colors.danger }]}
        >
          {errorText.trim()}
        </AppText>
      ) : helperText?.trim() ? (
        <AppText style={[styles.helperLine, { color: colors.textMuted }]}>
          {helperText.trim()}
        </AppText>
      ) : null}
    </View>
  );
});
