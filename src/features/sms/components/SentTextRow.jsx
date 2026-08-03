import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Divider } from '../../../components/ui';
import { useTheme } from '../../../theme';

const ICON_SIZE = 32;

/**
 * Compact timeline row for an outbound customer text.
 * Title + status + phone stay visible; tap to show/hide the message body.
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
 *   };
 *   showDividerBelow?: boolean;
 * }} props
 */
export function SentTextRow({ item, showDividerBelow = false }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const hasBody = Boolean(item.body?.trim());

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
          marginTop: 4,
        },
        divider: {
          marginLeft: ICON_SIZE + 12,
          marginVertical: 0,
        },
      }),
    [colors],
  );

  const a11yLabel = `${item.title}. ${item.statusLabel}. ${item.phoneDisplay}. ${item.timeLabel}`;

  const content = (
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
        {hasBody && expanded ? <AppText style={styles.body}>{item.body}</AppText> : null}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {hasBody ? (
        <Pressable
          accessibilityHint={expanded ? 'Hides the text message' : 'Shows the text message'}
          accessibilityLabel={a11yLabel}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((prev) => !prev)}
        >
          {content}
        </Pressable>
      ) : (
        <View accessibilityLabel={a11yLabel}>{content}</View>
      )}
      {showDividerBelow ? <Divider style={styles.divider} /> : null}
    </View>
  );
}
