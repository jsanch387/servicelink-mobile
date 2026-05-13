import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { FONT_FAMILIES, useTheme } from '../../theme';

/**
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.value
 * @param {boolean} [props.emphasize]
 * @param {boolean} [props.noTopMargin]
 * @param {import('@expo/vector-icons').IconProps['name']} [props.labelPrefixIcon]
 * @param {'default' | 'caption'} [props.labelAppearance] — `caption`: uppercase micro label (booking price / quote-style).
 */
export function LabelValueRow({
  label,
  value,
  emphasize = false,
  noTopMargin = false,
  labelPrefixIcon,
  labelAppearance = 'default',
}) {
  const { colors } = useTheme();
  const isCaption = labelAppearance === 'caption';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: noTopMargin ? 0 : isCaption ? 12 : 8,
        },
        labelDefault: {
          color: colors.textMuted,
          flex: 1,
          fontSize: 14,
          marginRight: 12,
        },
        labelCaption: {
          color: colors.textMuted,
          flex: 1,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginRight: 12,
          textTransform: 'uppercase',
        },
        labelWithIcon: {
          alignItems: 'center',
          flex: 1,
          flexDirection: 'row',
          marginRight: 12,
          minWidth: 0,
        },
        prefixIcon: {
          marginRight: 6,
        },
        valueDefault: {
          color: colors.text,
          fontSize: emphasize ? 16 : 15,
          fontWeight: emphasize ? '600' : '400',
          textAlign: 'right',
        },
        valueCaption: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: emphasize ? 16 : 15,
          fontWeight: emphasize ? '600' : '500',
          letterSpacing: emphasize ? -0.2 : -0.1,
          textAlign: 'right',
        },
        valueCaptionStrong: {
          color: colors.text,
        },
      }),
    [colors, emphasize, isCaption, noTopMargin],
  );

  const labelStyle = isCaption ? styles.labelCaption : styles.labelDefault;
  const valueStyle = [
    isCaption ? styles.valueCaption : styles.valueDefault,
    emphasize && isCaption ? styles.valueCaptionStrong : null,
  ];

  return (
    <View style={styles.row}>
      {labelPrefixIcon ? (
        <View style={styles.labelWithIcon}>
          <Ionicons
            color={colors.textMuted}
            name={labelPrefixIcon}
            size={13}
            style={styles.prefixIcon}
          />
          <AppText numberOfLines={1} style={labelStyle}>
            {label}
          </AppText>
        </View>
      ) : (
        <AppText style={labelStyle}>{label}</AppText>
      )}
      <AppText style={valueStyle}>{value}</AppText>
    </View>
  );
}
