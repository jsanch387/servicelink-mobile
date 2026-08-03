import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef, useMemo, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { FONT_FAMILIES, useTheme } from '../../theme';
import { AppText } from './AppText';
import { AppTextInput } from './AppTextInput';
import { iosKeyboardDoneAccessoryInputProps } from './KeyboardDoneAccessory';
import { SurfaceInputRow } from './SurfaceInputRow';

/** One text line — parent row centers this so iOS never pins glyphs to the bottom. */
const INPUT_LINE_HEIGHT = 22;

/**
 * Labeled input inside the same `cardSurface` shell as the customers search bar.
 * Optional `showPasswordToggle` adds an eye icon to reveal / hide text (`secureTextEntry`).
 * Optional `rightAccessory` adds a trailing node (e.g. calendar); ignored when `showPasswordToggle` is true.
 * Optional `onShellPress` wraps the input row in a pressable (e.g. date field + calendar). Use with `editable={false}` so taps reach the shell.
 * Optional `errorText` — small red line under the row (takes precedence over `helperText` for visibility).
 * Optional `errorHint` — muted second line under `errorText`.
 * Optional `helperText` — muted hint under the row (hidden when `errorText` is set).
 * Optional `prefixText` — static text inside the row that cannot be edited (e.g. `$`).
 * `label` may be a string or a React node (e.g. custom label styling).
 * Ref is forwarded to the inner `TextInput` (e.g. focus chaining).
 *
 * Placeholder is drawn with `AppText` (not the native TextInput placeholder). Native placeholders
 * mis-align on iOS inside tall rows / number pads; typed text stays on a single-line control
 * centered by the row.
 */
export const SurfaceTextField = forwardRef(function SurfaceTextField(
  {
    label,
    leftIcon,
    prefixText,
    errorText,
    errorHint,
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
  const isMultiline = Boolean(inputRest.multiline);
  const keyboardDoneAccessoryProps = iosKeyboardDoneAccessoryInputProps({
    existingAccessoryId: inputRest.inputAccessoryViewID,
    multiline: isMultiline,
  });
  const { colors } = useTheme();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  const secureTextEntry = showPasswordToggle ? !passwordVisible : (secureTextEntryProp ?? false);
  const hasError = Boolean(errorText?.trim());
  const hasValue = String(value ?? '').length > 0;
  const showOverlayPlaceholder = Boolean(placeholder) && !hasValue && !secureTextEntry;

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
          alignItems: isMultiline ? 'flex-start' : 'center',
          borderColor: hasError
            ? colors.danger
            : focused
              ? colors.borderStrong
              : colors.inputBorder,
          borderWidth: focused || hasError ? 1.5 : 1,
          paddingVertical: isMultiline ? 12 : 0,
        },
        iconPad: {
          alignItems: 'center',
          height: 52,
          justifyContent: 'center',
          marginRight: 4,
          width: 22,
        },
        prefixText: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '500',
          marginLeft: 2,
        },
        toggleHit: {
          alignItems: 'center',
          height: 52,
          justifyContent: 'center',
          marginLeft: 2,
          width: 40,
        },
        inputWrap: {
          flex: 1,
          justifyContent: isMultiline ? 'flex-start' : 'center',
          minHeight: isMultiline ? 72 : 52,
        },
        overlayPlaceholderWrap: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: isMultiline ? 'flex-start' : 'center',
          paddingLeft: 6,
          paddingRight: 4,
          paddingTop: isMultiline ? 0 : undefined,
        },
        overlayPlaceholder: {
          color: colors.placeholder,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 16,
          ...(isMultiline ? { lineHeight: 22 } : null),
        },
        input: {
          backgroundColor: 'transparent',
          borderWidth: 0,
          color: colors.inputText ?? colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 16,
          ...(isMultiline
            ? {
                minHeight: 72,
                paddingBottom: 4,
                paddingTop: 0,
              }
            : {
                height: INPUT_LINE_HEIGHT,
                paddingBottom: 0,
                paddingTop: 0,
              }),
          margin: 0,
          paddingLeft: 6,
          paddingRight: 4,
          width: '100%',
          ...Platform.select({
            android: {
              includeFontPadding: false,
              textAlignVertical: isMultiline ? 'top' : 'center',
            },
            default: {},
          }),
        },
        helperLine: {
          fontSize: 12,
          fontWeight: '500',
          lineHeight: 16,
          marginTop: 6,
        },
        errorHintLine: {
          fontSize: 12,
          lineHeight: 17,
          marginTop: 4,
        },
      }),
    [colors, compact, focused, hasError, isMultiline],
  );

  const leftNode =
    prefixText != null ? (
      <AppText style={styles.prefixText}>{prefixText}</AppText>
    ) : leftIcon != null ? (
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
      <View style={styles.inputWrap}>
        {showOverlayPlaceholder ? (
          <View pointerEvents="none" style={styles.overlayPlaceholderWrap}>
            <AppText numberOfLines={1} style={styles.overlayPlaceholder}>
              {placeholder}
            </AppText>
          </View>
        ) : null}
        <AppTextInput
          ref={ref}
          {...inputRest}
          {...keyboardDoneAccessoryProps}
          accessibilityLabel={
            inputRest.accessibilityLabel ?? (typeof label === 'string' ? label : undefined)
          }
          pointerEvents={onShellPress ? 'none' : inputRest.pointerEvents}
          clearButtonMode={inputRest.clearButtonMode ?? 'never'}
          scrollEnabled={inputRest.scrollEnabled ?? isMultiline}
          underlineColorAndroid="transparent"
          onBlur={(e) => {
            setFocused(false);
            inputRest.onBlur?.(e);
          }}
          onChangeText={onChangeText}
          onFocus={(e) => {
            setFocused(true);
            inputRest.onFocus?.(e);
          }}
          onSubmitEditing={(e) => {
            if (inputRest.onSubmitEditing) {
              inputRest.onSubmitEditing(e);
              return;
            }
            if (!isMultiline) {
              Keyboard.dismiss();
            }
          }}
          placeholder=""
          placeholderTextColor="transparent"
          secureTextEntry={secureTextEntry}
          style={[styles.input, restInputStyle]}
          value={value}
          maxLength={maxLength}
        />
      </View>
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
        <>
          <AppText
            accessibilityLiveRegion="polite"
            style={[styles.helperLine, { color: colors.danger }]}
          >
            {errorText.trim()}
          </AppText>
          {errorHint?.trim() ? (
            <AppText style={[styles.helperLine, styles.errorHintLine, { color: colors.textMuted }]}>
              {errorHint.trim()}
            </AppText>
          ) : null}
        </>
      ) : helperText?.trim() ? (
        <AppText style={[styles.helperLine, { color: colors.textMuted }]}>
          {helperText.trim()}
        </AppText>
      ) : null}
    </View>
  );
});
