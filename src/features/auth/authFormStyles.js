import { Platform, StyleSheet } from 'react-native';

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
    /** Login / sign-up: non-scrolling column (ScrollView not used). */
    authScreenMain: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 40,
    },
    centerBlock: {
      alignSelf: 'center',
      maxWidth: AUTH_FORM_MAX_WIDTH,
      width: '100%',
    },
    header: {
      alignItems: 'center',
      alignSelf: 'stretch',
      marginBottom: 28,
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
      fontSize: 28,
      fontWeight: '600',
      letterSpacing: -0.65,
      lineHeight: 32,
    },
    authHeadingSubtitle: {
      alignSelf: 'center',
      fontSize: 15,
      fontWeight: '400',
      letterSpacing: -0.15,
      lineHeight: 21,
      marginTop: 4,
      maxWidth: 300,
      paddingHorizontal: 8,
    },
    /** Groups fields + actions; rows stay `cardSurface` for contrast against this panel. */
    authFormPanel: {
      alignSelf: 'stretch',
      backgroundColor: colors.surface,
      borderColor: colors.cardBorder,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 16,
      paddingTop: 22,
      paddingBottom: 22,
      width: '100%',
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.09,
          shadowRadius: 24,
        },
        default: {},
      }),
    },
    /** Stacked fields use SurfaceTextField default spacing (20px below each field). */
    form: {
      width: '100%',
    },
    divider: {
      alignItems: 'center',
      flexDirection: 'row',
      marginVertical: 20,
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
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1.2,
      marginHorizontal: 16,
      textTransform: 'uppercase',
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
