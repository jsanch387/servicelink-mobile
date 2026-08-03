import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Divider } from '../../../components/ui';
import { useTheme } from '../../../theme';

const ICON_SIZE = 32;

/**
 * Compact timeline row for an outbound customer text.
 *
 * @param {{
 *   item: {
 *     title: string;
 *     iconName: import('@expo/vector-icons/Ionicons').IconProps['name'];
 *     body: string;
 *     statusLabel: string;
 *     statusTone: 'success' | 'muted' | 'danger' | 'info';
 *     phoneDisplay: string;
 *     timeLabel: string;
 *     error: string;
 *   };
 *   showDividerBelow?: boolean;
 * }} props
 */
export function SentTextRow({ item, showDividerBelow = false }) {
  const { colors } = useTheme();

  const statusColor = useMemo(() => {
    if (item.statusTone === 'success') {
      return colors.textSuccess;
    }
    if (item.statusTone === 'danger') {
      return colors.danger;
    }
    if (item.statusTone === 'info') {
      return colors.accent;
    }
    return colors.textMuted;
  }, [colors, item.statusTone]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignSelf: 'stretch',
        },
        row: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        iconWrap: {
          alignItems: 'center',
          backgroundColor: colors.inputBg,
          borderColor: colors.border,
          borderRadius: ICON_SIZE / 2,
          borderWidth: StyleSheet.hairlineWidth,
          height: ICON_SIZE,
          justifyContent: 'center',
          marginTop: 1,
          width: ICON_SIZE,
        },
        copy: {
          flex: 1,
          gap: 3,
          minWidth: 0,
        },
        titleRow: {
          alignItems: 'baseline',
          flexDirection: 'row',
          gap: 10,
          justifyContent: 'space-between',
        },
        title: {
          color: colors.text,
          flex: 1,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
          lineHeight: 20,
        },
        time: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: -0.05,
        },
        meta: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: -0.05,
          lineHeight: 16,
        },
        status: {
          fontWeight: '600',
        },
        body: {
          color: colors.textSecondary,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.05,
          lineHeight: 18,
          marginTop: 1,
        },
        error: {
          color: statusColor,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: -0.05,
          lineHeight: 16,
          marginTop: 1,
        },
        divider: {
          marginLeft: 14 + ICON_SIZE + 12,
          marginVertical: 0,
        },
      }),
    [colors, statusColor],
  );

  return (
    <View
      accessibilityLabel={`${item.title}. ${item.statusLabel}. ${item.phoneDisplay}. ${item.timeLabel}`}
      style={styles.root}
    >
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.textSecondary} name={item.iconName} size={16} />
        </View>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <AppText style={styles.title}>{item.title}</AppText>
            {item.timeLabel ? <AppText style={styles.time}>{item.timeLabel}</AppText> : null}
          </View>
          <AppText style={styles.meta}>
            <AppText style={[styles.meta, styles.status, { color: statusColor }]}>
              {item.statusLabel}
            </AppText>
            {item.phoneDisplay ? ` · ${item.phoneDisplay}` : ''}
          </AppText>
          {item.body ? (
            <AppText numberOfLines={2} style={styles.body}>
              {item.body}
            </AppText>
          ) : null}
          {item.error ? <AppText style={styles.error}>{item.error}</AppText> : null}
        </View>
      </View>
      {showDividerBelow ? <Divider style={styles.divider} /> : null}
    </View>
  );
}
