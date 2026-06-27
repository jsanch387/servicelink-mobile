import { StyleSheet } from 'react-native';
import { SCREEN_GUTTER } from '../../../../constants/layout';

/**
 * @param {{ text: string; border: string; textMuted: string }} colors theme colors subset
 */
export function createAppointmentFlowStyles(colors) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingBottom: 24,
      paddingHorizontal: SCREEN_GUTTER,
      paddingTop: 2,
    },
    contentConfirmed: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingTop: 0,
    },
    stepHeader: {
      marginBottom: 22,
    },
    stepHeaderCopy: {
      gap: 2,
    },
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: -0.35,
      lineHeight: 25,
    },
    stepSubtitle: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
      letterSpacing: 0,
      lineHeight: 16,
    },
  });
}
