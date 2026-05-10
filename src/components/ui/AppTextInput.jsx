import { forwardRef } from 'react';
import { TextInput as RNTextInput } from 'react-native';
import { useTypography } from '../../theme';

/** Same font stack as `AppText` for inputs (preset body / regular). */
export const AppTextInput = forwardRef(function AppTextInput({ style, ...rest }, ref) {
  const { fontFamily } = useTypography();
  const fam = fontFamily.regular;
  if (!fam) {
    return <RNTextInput ref={ref} style={style} {...rest} />;
  }
  return <RNTextInput ref={ref} style={[{ fontFamily: fam }, style]} {...rest} />;
});
