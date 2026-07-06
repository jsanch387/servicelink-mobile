import { StyleSheet } from 'react-native';
import { SCREEN_GUTTER } from '../../../../constants/layout';

export function createAppointmentFlowStyles() {
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
      paddingTop: 0,
    },
    contentConfirmed: {
      alignItems: 'center',
      flexGrow: 1,
      justifyContent: 'center',
      paddingBottom: 16,
    },
    contentSubmitting: {
      flexGrow: 1,
    },
  });
}
