import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { frostedSurfaceColors } from './FrostedIconWell';

/**
 * Frosted glass panel used on Payments → Transactions (Available / On the way).
 *
 * @param {{ children: import('react').ReactNode; style?: object }} props
 */
export function FrostedCard({ children, style, ...rest }) {
  const { isDark } = useTheme();
  const frost = frostedSurfaceColors(isDark);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: frost.backgroundColor,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
});
