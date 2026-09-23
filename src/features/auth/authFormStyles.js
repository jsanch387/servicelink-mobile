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
    /** Use on SafeAreaView / KAV / ScrollView when AppShellGlow sits behind them. */
    shellGlowSafe: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    shellGlowKeyboard: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    shellGlowScroll: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    /** Login / sign-up column. `flexGrow` lets a ScrollView center short content and scroll when the keyboard is up. */
    authScreenMain: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingBottom: 28,
      paddingTop: 12,
    },
    centerBlock: {
      alignSelf: 'center',
      maxWidth: AUTH_FORM_MAX_WIDTH,
      width: '100%',
    },
    header: {
      alignItems: 'center',
      alignSelf: 'stretch',
      marginBottom: 32,
    },
    title: {
      alignSelf: 'stretch',
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      alignSelf: 'stretch',
      color: colors.textMuted,
      textAlign: 'center',
    },
    authHeadingTitle: {
      fontSize: 32,
      fontWeight: '600',
      letterSpacing: -0.9,
      lineHeight: 38,
    },
    authHeadingSubtitle: {
      alignSelf: 'center',
      fontSize: 16,
      fontWeight: '400',
      letterSpacing: -0.2,
      lineHeight: 23,
      marginTop: 8,
      maxWidth: 300,
      paddingHorizontal: 8,
    },
    /** Fields and actions sit directly on the shell — inputs already have their own surface. */
    authFormPanel: {
      alignSelf: 'stretch',
      width: '100%',
    },
    /** Stacked fields use SurfaceTextField default spacing (20px below each field). */
    form: {
      width: '100%',
    },
    divider: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: 16,
      marginTop: 22,
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
      letterSpacing: -0.1,
      marginHorizontal: 14,
    },
    /** Google + Apple stacked full width. */
    oauthStack: {
      gap: 10,
      width: '100%',
    },
    /** Google + Apple: equal-width halves (`oauthHalf` wraps each control). */
    oauthRow: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    oauthHalf: {
      alignSelf: 'stretch',
      flexBasis: 0,
      flexGrow: 1,
      minWidth: 0,
    },
    footer: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: 36,
    },
    link: {
      color: colors.link,
    },
    /** Muted line in footer row (e.g. “Already have an account?”). */
    footerPrompt: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.15,
    },
    footerMuted: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '400',
      letterSpacing: 0.15,
    },
    /** Primary footer CTA (e.g. Create an account / Sign in). */
    footerLinkStrong: {
      color: colors.link,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: -0.15,
    },
  };
}
