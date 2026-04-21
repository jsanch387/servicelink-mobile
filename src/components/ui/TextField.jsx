import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../theme';

/**
 * Shared labeled text input — outline style from theme (`inputBorder` / `inputBg`).
 */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  autoCapitalize = 'none',
  keyboardType,
  autoComplete,
  containerStyle,
  inputStyle,
  ...rest
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.field, containerStyle]}>
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
      <TextInput
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={secureTextEntry}
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.inputText,
          },
          inputStyle,
        ]}
        value={value}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1.5,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
