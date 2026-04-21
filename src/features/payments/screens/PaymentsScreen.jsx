import { StyleSheet, View } from 'react-native';
import { AppShellGlow } from '../../../components/ui';
import { useTheme } from '../../../theme';

export function PaymentsScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.shell }]}>
      <AppShellGlow />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
