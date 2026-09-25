import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.body
 * @param {import('@expo/vector-icons/Ionicons').IconProps['name']} [props.iconName]
 * @param {import('react-native').StyleProp<import('react-native').ViewStyle>} [props.style]
 */
export function ExpenseEmptyState({ title, body, iconName = 'receipt-outline', style }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 16,
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
        copy: {
          alignItems: 'center',
          gap: 2,
          maxWidth: 280,
        },
        title: {
          color: colors.textSecondary,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.2,
          lineHeight: 22,
          textAlign: 'center',
        },
        body: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 20,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.iconRing}>
        <Ionicons color={colors.textMuted} name={iconName} size={30} />
      </View>
      <View style={styles.copy}>
        <AppText style={styles.title}>{title}</AppText>
        <AppText style={styles.body}>{body}</AppText>
      </View>
    </View>
  );
}
