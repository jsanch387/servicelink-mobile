import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { DetailsSectionCard } from './DetailsSectionCard';
import { useTheme } from '../../theme';

function InfoRow({
  icon,
  value,
  hideIcon = false,
  emphasize = false,
  onPress,
  accessibilityLabel,
  /** `'underline'` when tappable (default). Use `'none'` for e.g. copy rows with a trailing icon. */
  interactionStyle,
  trailing = null,
}) {
  const { colors } = useTheme();
  const interactive = typeof onPress === 'function';
  const underline =
    interactive && (interactionStyle === undefined || interactionStyle === 'underline');
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
        valueRow: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginLeft: 0,
        },
        text: {
          color: interactive ? colors.text : colors.textSecondary,
          flexGrow: 1,
          flexShrink: 1,
          fontSize: 15,
          fontWeight: emphasize ? '600' : '400',
          lineHeight: 21,
          marginLeft: hideIcon ? 0 : 10,
          textDecorationLine: underline ? 'underline' : 'none',
        },
        textNoTrailing: {
          flex: 1,
        },
        trailingWrap: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 4,
          marginLeft: 8,
          marginTop: 1,
        },
      }),
    [colors, emphasize, hideIcon, interactive, underline],
  );

  const textBlock = trailing ? (
    <View style={styles.valueRow}>
      <AppText style={styles.text}>{value}</AppText>
      <View style={styles.trailingWrap}>{trailing}</View>
    </View>
  ) : (
    <AppText style={[styles.text, styles.textNoTrailing]}>{value}</AppText>
  );

  const content = (
    <View style={styles.row}>
      {hideIcon ? null : (
        <Ionicons color={colors.textMuted} name={icon} size={16} style={{ marginTop: 2 }} />
      )}
      {textBlock}
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

/**
 * @param {object} props
 * @param {'default' | 'overline'} [props.titleTone] — forwarded to `DetailsSectionCard`.
 * @param {'default' | 'roomy'} [props.bodyPadding] — forwarded to `DetailsSectionCard`.
 */
export function InfoSection({
  title,
  rows,
  hideIcons = false,
  footer = null,
  rowGap = 9,
  titleTone = 'default',
  bodyPadding = 'default',
}) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        rowsWrap: {
          rowGap,
        },
        footerWrap: {
          marginTop: 12,
        },
      }),
    [rowGap],
  );

  return (
    <DetailsSectionCard bodyPadding={bodyPadding} title={title} titleTone={titleTone}>
      <View style={styles.rowsWrap}>
        {rows.map((row, index) => (
          <InfoRow
            emphasize={Boolean(row.emphasize)}
            hideIcon={hideIcons || Boolean(row.hideIcon)}
            key={row.key ?? `${title}-${index}`}
            icon={row.icon}
            interactionStyle={row.interactionStyle}
            trailing={row.trailing}
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
