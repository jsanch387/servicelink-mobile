import { StyleSheet } from 'react-native';

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
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: -0.35,
      marginBottom: 22,
    },
  });
}
