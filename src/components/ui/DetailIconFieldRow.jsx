import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { FONT_FAMILIES, useTheme } from '../../theme';

/**
 * Icon + label + value row (quote detail / booking schedule pattern).
 * Pass `onPress` to make the row tappable (chevron on the right).
 *
 * @param {{
 *   icon: import('@expo/vector-icons').IconProps['name'];
 *   label: string;
 *   value?: string;
 *   valueNode?: import('react').ReactNode;
 *   labelUppercase?: boolean;
 *   iconColor?: string;
 *   centerIcon?: boolean;
 *   onPress?: () => void;
 *   accessibilityHint?: string;
 * }} props
 */
export function DetailIconFieldRow({
  icon,
  label,
  value = '',
  valueNode = null,
  labelUppercase = true,
  iconColor,
  centerIcon = false,
  onPress,
  accessibilityHint,
}) {
  const { colors } = useTheme();
  const tappable = typeof onPress === 'function';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          alignItems: tappable || centerIcon ? 'center' : 'flex-start',
          flexDirection: 'row',
          gap: 14,
          width: '100%',
        },
        pressed: {
          opacity: 0.72,
        },
        iconWrap: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: tappable || centerIcon ? 0 : 2,
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
        chevronCol: {
          alignItems: 'center',
          height: 22,
          justifyContent: 'center',
          width: 22,
        },
      }),
    [centerIcon, colors, labelUppercase, tappable],
  );

  const content = (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons color={iconColor ?? colors.accentMuted} name={icon} size={19} />
      </View>
      <View style={styles.textCol}>
        <AppText style={styles.label}>{label}</AppText>
        {valueNode ?? <AppText style={styles.value}>{value}</AppText>}
      </View>
      {tappable ? (
        <View style={styles.chevronCol}>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
        </View>
      ) : null}
    </View>
  );

  if (!tappable) return content;

  return (
    <Pressable accessibilityHint={accessibilityHint} accessibilityRole="button" onPress={onPress}>
      {({ pressed }) => <View style={pressed ? styles.pressed : null}>{content}</View>}
    </Pressable>
  );
}
