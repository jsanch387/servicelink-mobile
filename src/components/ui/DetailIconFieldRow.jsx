import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { FONT_FAMILIES, useTheme } from '../../theme';

/**
 * Icon + label + value row (quote detail / booking schedule pattern).
 *
 * @param {{
 *   icon: import('@expo/vector-icons').IconProps['name'];
 *   label: string;
 *   value: string;
 *   labelUppercase?: boolean;
 * }} props
 */
export function DetailIconFieldRow({ icon, label, value, labelUppercase = true }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          gap: 14,
        },
        iconWrap: {
          paddingTop: 2,
          width: 22,
        },
        label: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: labelUppercase ? 12 : 13,
          fontWeight: '600',
          letterSpacing: labelUppercase ? 0.2 : -0.1,
          marginBottom: 4,
          textTransform: labelUppercase ? 'uppercase' : 'none',
        },
        value: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.15,
          lineHeight: 22,
        },
        textCol: {
          flex: 1,
          minWidth: 0,
        },
      }),
    [colors, labelUppercase],
  );

  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons color={colors.accentMuted} name={icon} size={19} />
      </View>
      <View style={styles.textCol}>
        <AppText style={styles.label}>{label}</AppText>
        <AppText style={styles.value}>{value}</AppText>
      </View>
    </View>
  );
}
