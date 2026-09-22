import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { FrostedIconWell } from './FrostedIconWell';
import { FONT_FAMILIES, useTheme } from '../../theme';

/**
 * Frosted icon + headline + muted line. Used on booking Visit / Payment cards.
 *
 * @param {object} props
 * @param {string} props.icon
 * @param {'ionicons' | 'material-community'} [props.iconLibrary]
 * @param {string} props.primary
 * @param {string} [props.secondary]
 * @param {() => void} [props.onPress]
 * @param {boolean} [props.showChevron]
 * @param {string} [props.accessibilityHint]
 * @param {string} [props.accessibilityLabel]
 * @param {boolean} [props.compact] Quieter type for supporting rows (visit date / address).
 */
export function DetailsLeadRow({
  icon,
  iconLibrary = 'ionicons',
  primary,
  secondary = '',
  onPress,
  showChevron = false,
  compact = false,
  accessibilityHint,
  accessibilityLabel,
}) {
  const { colors } = useTheme();
  const interactive = typeof onPress === 'function';
  const title = String(primary ?? '').trim();
  const subtitle = String(secondary ?? '').trim();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        press: {
          width: '100%',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        pressed: {
          opacity: 0.72,
        },
        iconWrap: {
          marginRight: compact ? 12 : 14,
        },
        copyCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        primary: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: compact ? 15 : 16,
          fontWeight: '600',
          letterSpacing: compact ? -0.15 : -0.25,
          lineHeight: compact ? 20 : 21,
        },
        secondary: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: compact ? 13 : 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: compact ? 18 : 19,
          marginTop: compact ? 2 : 3,
        },
        chevronCol: {
          alignItems: 'center',
          height: 22,
          justifyContent: 'center',
          marginLeft: 10,
          width: 22,
        },
      }),
    [colors, compact],
  );

  const body = (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <FrostedIconWell
          color="#ffffff"
          icon={icon}
          iconLibrary={iconLibrary}
          iconSize={compact ? 16 : 18}
          size={compact ? 32 : 36}
        />
      </View>
      <View style={styles.copyCol}>
        <AppText numberOfLines={1} style={styles.primary}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText numberOfLines={1} style={styles.secondary}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {showChevron ? (
        <View style={styles.chevronCol}>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
        </View>
      ) : null}
    </View>
  );

  if (!interactive) {
    return (
      <View accessible accessibilityLabel={accessibilityLabel || title}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      style={styles.press}
      onPress={onPress}
    >
      {({ pressed }) => <View style={pressed ? styles.pressed : null}>{body}</View>}
    </Pressable>
  );
}
