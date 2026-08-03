import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';

/**
 * Centered empty state for Bookings list / day views — icon + short title only.
 *
 * @param {{
 *   title: string;
 *   iconName?: import('@expo/vector-icons/Ionicons').IconProps['name'];
 *   style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
 * }} props
 */
export function BookingsEmptyState({ title, iconName = 'calendar-outline', style }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignItems: 'center',
          alignSelf: 'stretch',
          flexGrow: 1,
          justifyContent: 'center',
          paddingBottom: 40,
          paddingHorizontal: 24,
          paddingTop: 24,
        },
        iconRing: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderRadius: 999,
          height: 72,
          justifyContent: 'center',
          marginBottom: 18,
          width: 72,
        },
        title: {
          color: colors.textMuted,
          fontSize: 18,
          fontWeight: '500',
          letterSpacing: -0.25,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <View style={[styles.root, style]}>
      <View style={styles.iconRing}>
        <Ionicons color={colors.textMuted} name={iconName} size={30} />
      </View>
      <AppText style={styles.title}>{title}</AppText>
    </View>
  );
}
