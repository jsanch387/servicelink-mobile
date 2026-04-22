import { Text as RNText, StyleSheet } from 'react-native';
import { useTypography } from '../../theme';

/**
 * Applies Plus Jakarta Sans from `useTypography` — `Text.defaultProps` is unreliable in RN,
 * so we set `fontFamily` explicitly per render.
 */
function pickFamily(fonts, flat) {
  if (flat.fontFamily) {
    return flat.fontFamily;
  }
  if (!fonts.regular) {
    return undefined;
  }
  const w = flat.fontWeight;
  if (w === '700' || w === 'bold' || w === 700 || w === '800' || w === 800) {
    return fonts.bold ?? fonts.semibold ?? fonts.regular;
  }
  if (w === '600' || w === 'semibold' || w === 600) {
    return fonts.semibold ?? fonts.medium ?? fonts.regular;
  }
  if (w === '500' || w === 'medium' || w === 500) {
    return fonts.medium ?? fonts.regular;
  }
  return fonts.regular;
}

export function AppText({ style, ...rest }) {
  const { fontFamily } = useTypography();
  const flat = StyleSheet.flatten(style) || {};
  const fam = pickFamily(fontFamily, flat);
  if (!fam) {
    return <RNText style={style} {...rest} />;
  }
  return <RNText style={[{ fontFamily: fam }, style]} {...rest} />;
}
