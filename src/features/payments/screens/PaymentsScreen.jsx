import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme';

export function PaymentsScreen() {
  const { colors } = useTheme();
  return <View style={[styles.root, { backgroundColor: colors.shell }]} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
