import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { DetailsSectionCard } from './DetailsSectionCard';

function InfoRow({
  icon,
  value,
  hideIcon = false,
  emphasize = false,
  onPress,
  accessibilityLabel,
}) {
  const { colors } = useTheme();
  const interactive = typeof onPress === 'function';
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          alignItems: 'flex-start',
          flexDirection: 'row',
        },
        rowPressable: {
          borderRadius: 10,
          paddingHorizontal: 2,
          paddingVertical: 1,
        },
        text: {
          color: interactive ? colors.text : colors.textSecondary,
          flex: 1,
          fontSize: 15,
          fontWeight: emphasize ? '600' : '400',
          lineHeight: 21,
          marginLeft: hideIcon ? 0 : 10,
          textDecorationLine: interactive ? 'underline' : 'none',
        },
      }),
    [colors, emphasize, hideIcon, interactive],
  );

  const content = (
    <View style={styles.row}>
      {hideIcon ? null : (
        <Ionicons color={colors.textMuted} name={icon} size={16} style={{ marginTop: 2 }} />
      )}
      <AppText style={styles.text}>{value}</AppText>
    </View>
  );

  if (!interactive) {
    return content;
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.rowPressable}
    >
      {content}
    </Pressable>
  );
}

export function InfoSection({ title, rows, hideIcons = false, footer = null }) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        rowsWrap: {
          rowGap: 9,
        },
        footerWrap: {
          marginTop: 12,
        },
      }),
    [],
  );

  return (
    <DetailsSectionCard title={title}>
      <View style={styles.rowsWrap}>
        {rows.map((row) => (
          <InfoRow
            emphasize={Boolean(row.emphasize)}
            hideIcon={hideIcons || Boolean(row.hideIcon)}
            key={`${title}-${row.icon}-${row.value}`}
            icon={row.icon}
            value={row.value}
            onPress={row.onPress}
            accessibilityLabel={row.accessibilityLabel}
          />
        ))}
      </View>
      {footer ? <View style={styles.footerWrap}>{footer}</View> : null}
    </DetailsSectionCard>
  );
}
