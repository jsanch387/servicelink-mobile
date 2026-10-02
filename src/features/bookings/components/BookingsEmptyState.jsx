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
 *   compact?: boolean;
 *   style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
 * }} props
 */
export function BookingsEmptyState({
  title,
  iconName = 'calendar-outline',
  compact = false,
  style,
}) {
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
          height: compact ? 48 : 72,
          justifyContent: 'center',
          marginBottom: compact ? 10 : 18,
          width: compact ? 48 : 72,
        },
        title: {
          color: colors.textMuted,
          fontSize: compact ? 15 : 18,
          fontWeight: '500',
          letterSpacing: -0.25,
          textAlign: 'center',
        },
      }),
    [colors, compact],
  );

  return (
    <View style={[styles.root, style]}>
      <View style={styles.iconRing}>
        <Ionicons color={colors.textMuted} name={iconName} size={compact ? 20 : 30} />
      </View>
      <AppText style={styles.title}>{title}</AppText>
    </View>
  );
}
