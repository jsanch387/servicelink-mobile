import { StyleSheet } from 'react-native';

export const APP_LAUNCH_LOGO_SOURCE = require('../../../assets/images/servicelink-logo.png');

/**
 * @param {import('../../theme/themes').ThemeColors} colors
 */
export function createAppLaunchScreenStyles(colors) {
  return StyleSheet.create({
    root: {
      backgroundColor: colors.shell,
      flex: 1,
    },
    inner: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    logoBlock: {
      alignItems: 'center',
    },
    logo: {
      height: 92,
      maxWidth: '100%',
      width: 304,
    },
    title: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '600',
      letterSpacing: -0.45,
      marginTop: 4,
    },
    bottom: {
      alignItems: 'center',
      marginTop: 28,
      minHeight: 36,
    },
  });
}
