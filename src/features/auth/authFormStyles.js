import { StyleSheet } from 'react-native';

export const AUTH_FORM_MAX_WIDTH = 400;

/**
 * Shared layout/styles for login & sign-up (scroll, form width, divider, social row, footer row).
 * @param {import('../../theme/themes').ThemeColors} colors
 */
export function getAuthFormSharedStyles(colors) {
  return {
    screen: {
      flex: 1,
      backgroundColor: colors.shell,
    },
    safe: {
      flex: 1,
      backgroundColor: colors.shell,
    },
    keyboard: {
      flex: 1,
      backgroundColor: colors.shell,
    },
    scroll: {
      flex: 1,
      backgroundColor: colors.shell,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 32,
    },
    centerBlock: {
      alignSelf: 'center',
      maxWidth: AUTH_FORM_MAX_WIDTH,
      width: '100%',
    },
    header: {
      alignItems: 'flex-start',
      alignSelf: 'stretch',
      marginBottom: 32,
    },
    title: {
      alignSelf: 'stretch',
      color: colors.text,
      textAlign: 'left',
    },
    subtitle: {
      alignSelf: 'stretch',
      color: colors.textMuted,
      textAlign: 'left',
    },
    form: {
      width: '100%',
    },
    divider: {
      alignItems: 'center',
      flexDirection: 'row',
      marginVertical: 24,
      width: '100%',
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth * 2,
      maxHeight: 1,
    },
    dividerLineFill: {
      backgroundColor: colors.border,
    },
    dividerText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
      marginHorizontal: 14,
      textTransform: 'lowercase',
    },
    socialRow: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    socialHalf: {
      flexBasis: 0,
      flexGrow: 1,
      minWidth: 0,
    },
    footer: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: 40,
    },
    link: {
      color: colors.link,
    },
    footerMuted: {
      color: colors.textMuted,
    },
  };
}
