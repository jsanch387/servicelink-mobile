import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

/**
 * Compact round membership emblem — uses theme primary fill so it matches the app.
 *
 * @param {object} [props]
 * @param {'sm' | 'md'} [props.size]
 * @param {import('react-native').StyleProp<import('react-native').ViewStyle>} [props.style]
 */
export function MembershipMark({ size = 'sm', style }) {
  const { colors } = useTheme();
  const isMd = size === 'md';

  const wrap = isMd ? 20 : 16;
  const icon = isMd ? 11 : 9;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        styles.wrap,
        {
          backgroundColor: colors.buttonPrimaryBg,
          borderRadius: wrap / 2,
          height: wrap,
          width: wrap,
        },
        style,
      ]}
    >
      <Ionicons color={colors.buttonPrimaryText} name="repeat" size={icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'center',
    marginLeft: 7,
    marginTop: 1,
  },
});
