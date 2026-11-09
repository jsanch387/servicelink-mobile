import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

const ROW_PAD_H = 16;
const CHEVRON_W = 22;

/**
 * Label on the left, optional value on the right, chevron when tappable.
 * Row layout lives on an inner View — Pressable does not reliably honor flexDirection.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string} [props.value]
 * @param {number} [props.valueNumberOfLines]
 * @param {() => void} [props.onPress]
 * @param {boolean} [props.showDividerBelow]
 * @param {boolean} [props.disabled]
 * @param {string} [props.accessibilityLabel]
 * @param {string} [props.accessibilityHint]
 */
export function ValueNavRow({
  label,
  value,
  valueNumberOfLines = 1,
  onPress,
  showDividerBelow = true,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}) {
  const { colors } = useTheme();
  const valueText = String(value ?? '').trim();
  const tappable = typeof onPress === 'function' && !disabled;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignSelf: 'stretch',
          width: '100%',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          minHeight: 52,
          paddingHorizontal: ROW_PAD_H,
          paddingVertical: 13,
          width: '100%',
        },
        pressed: {
          backgroundColor: colors.buttonGhostPressed,
        },
        disabled: {
          opacity: 0.45,
        },
        labelCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        label: {
          color: colors.text,
          fontSize: 16,
          letterSpacing: -0.2,
        },
        valueCol: {
          alignItems: 'flex-end',
          flexShrink: 1,
          justifyContent: 'center',
          marginLeft: 12,
          maxWidth: '48%',
        },
        value: {
          color: colors.textMuted,
          fontSize: 16,
          letterSpacing: -0.2,
          textAlign: 'right',
        },
        chevronCol: {
          alignItems: 'center',
          height: CHEVRON_W,
          justifyContent: 'center',
          marginLeft: 8,
          width: CHEVRON_W,
        },
        dividerRow: {
          flexDirection: 'row',
          paddingLeft: ROW_PAD_H,
          paddingRight: ROW_PAD_H,
        },
        hairline: {
          backgroundColor: colors.border,
          flex: 1,
          height: StyleSheet.hairlineWidth,
          opacity: 0.55,
        },
      }),
    [colors],
  );

  const body = (pressed) => (
    <View style={[styles.row, pressed && tappable && styles.pressed, disabled && styles.disabled]}>
      <View style={styles.labelCol}>
        <AppText numberOfLines={1} style={styles.label}>
          {label}
        </AppText>
      </View>
      {valueText ? (
        <View style={styles.valueCol}>
          <AppText numberOfLines={valueNumberOfLines} style={styles.value}>
            {valueText}
          </AppText>
        </View>
      ) : null}
      {tappable ? (
        <View style={styles.chevronCol}>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.root}>
      {tappable ? (
        <Pressable
          accessibilityHint={accessibilityHint}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityRole="button"
          disabled={disabled}
          onPress={onPress}
        >
          {({ pressed }) => body(pressed)}
        </Pressable>
      ) : (
        <View
          accessibilityLabel={accessibilityLabel || (valueText ? `${label}, ${valueText}` : label)}
        >
          {body(false)}
        </View>
      )}
      {showDividerBelow ? (
        <View style={styles.dividerRow}>
          <View style={styles.hairline} />
        </View>
      ) : null}
    </View>
  );
}
