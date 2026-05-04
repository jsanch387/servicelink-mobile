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
    /** Stacked fields use {@link SurfaceTextField} default spacing (20px below each field). */
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
    /** Muted line in footer row (e.g. “Already have an account?”). */
    footerPrompt: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
    footerMuted: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '400',
    },
    /** Primary footer CTA (e.g. Create an account / Sign in). */
    footerLinkStrong: {
      color: colors.link,
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: -0.1,
    },
  };
}
