import { TextInput as RNTextInput } from 'react-native';
import { useTypography } from '../../theme';

/** Same font stack as `AppText` for inputs (preset body / regular). */
export function AppTextInput({ style, ...rest }) {
  const { fontFamily } = useTypography();
  const fam = fontFamily.regular;
  if (!fam) {
    return <RNTextInput style={style} {...rest} />;
  }
  return <RNTextInput style={[{ fontFamily: fam }, style]} {...rest} />;
}
