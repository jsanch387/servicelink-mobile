import { forwardRef } from 'react';
import { StyleSheet, TextInput as RNTextInput } from 'react-native';
import { useTypography } from '../../theme';

/**
 * Same font stack as `AppText` for inputs.
 * Flatten style and apply a single `fontFamily` so iOS placeholders match typed text
 * (nested style arrays + a default family made placeholders fall back to the system font).
 */
export const AppTextInput = forwardRef(function AppTextInput({ style, ...rest }, ref) {
  const { fontFamily } = useTypography();
  const flat = StyleSheet.flatten(style) ?? {};
  const fam = flat.fontFamily || fontFamily.regular;

  // Custom loaded families + numeric fontWeight → broken / system placeholders on iOS.
  const { fontWeight: _fontWeight, fontFamily: _fontFamily, ...safeStyle } = flat;

  if (!fam) {
    return <RNTextInput ref={ref} style={style} {...rest} />;
  }

  return <RNTextInput ref={ref} style={[safeStyle, { fontFamily: fam }]} {...rest} />;
});
