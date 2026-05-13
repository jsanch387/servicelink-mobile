import { StyleSheet } from 'react-native';
import { SCREEN_GUTTER } from '../../../../constants/layout';

/**
 * @param {{ text: string; border: string }} colors theme colors subset
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
      paddingTop: 12,
    },
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: -0.35,
      marginBottom: 22,
    },
    /** Review step: main title sits just above the subtitle (~5px gap). */
    titleTightToSubtitle: {
      marginBottom: 5,
    },
  });
}
