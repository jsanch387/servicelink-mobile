import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

export function LabelValueRow({
  label,
  value,
  emphasize = false,
  noTopMargin = false,
  labelPrefixIcon,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: noTopMargin ? 0 : 8,
        },
        label: {
          color: colors.textMuted,
          flex: 1,
          fontSize: 14,
          marginRight: 12,
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
        value: {
          color: colors.text,
          fontSize: emphasize ? 17 : 15,
          fontWeight: emphasize ? '700' : '400',
          textAlign: 'right',
        },
      }),
    [colors, emphasize, noTopMargin],
  );

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
          <AppText numberOfLines={1} style={styles.label}>
            {label}
          </AppText>
        </View>
      ) : (
        <AppText style={styles.label}>{label}</AppText>
      )}
      <AppText style={styles.value}>{value}</AppText>
    </View>
  );
}
