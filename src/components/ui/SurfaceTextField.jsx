import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { AppTextInput } from './AppTextInput';
import { SurfaceInputRow, useSurfaceInputTextStyle } from './SurfaceInputRow';

/**
 * Labeled input inside the same `cardSurface` shell as the customers search bar.
 * Optional `showPasswordToggle` adds an eye icon to reveal / hide text (`secureTextEntry`).
 */
export function SurfaceTextField({
  label,
  leftIcon,
  showPasswordToggle = false,
  value,
  onChangeText,
  placeholder,
  secureTextEntry: secureTextEntryProp,
  containerStyle,
  maxLength: maxLengthProp,
  /** Tighter vertical rhythm for dense forms (e.g. create-appointment). */
  compact = false,
  ...rest
}) {
  const { style: restInputStyle, maxLength: maxLengthFromRest, ...inputRest } = rest;
  const maxLength = maxLengthProp ?? maxLengthFromRest;
  const { colors } = useTheme();
  const inputTextStyle = useSurfaceInputTextStyle();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  const secureTextEntry = showPasswordToggle ? !passwordVisible : (secureTextEntryProp ?? false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        field: {
          marginBottom: compact ? 12 : 20,
        },
        label: {
          fontSize: 14,
          fontWeight: '500',
          marginBottom: compact ? 6 : 8,
        },
        rowShell: {
          borderColor: focused ? colors.borderStrong : colors.inputBorder,
          borderWidth: focused ? 1.5 : 1,
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
      }),
    [colors, compact, focused],
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
  ) : null;

  return (
    <View style={[styles.field, containerStyle]}>
      {label ? (
        <AppText style={[styles.label, { color: colors.textMuted }]}>{label}</AppText>
      ) : null}
      <SurfaceInputRow left={leftNode} right={rightNode} style={styles.rowShell}>
        <AppTextInput
          {...inputRest}
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
    </View>
  );
}
