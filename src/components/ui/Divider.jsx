import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

export function Divider({ style }) {
  const { colors } = useTheme();

  return <View style={[styles.base, { backgroundColor: colors.border }, style]} />;
}

const styles = StyleSheet.create({
  base: {
    height: 1,
    opacity: 0.55,
    width: '100%',
  },
});
