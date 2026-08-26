import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';

function friendlyDetail(detail) {
  const safe = safeUserFacingMessage(detail, {
    fallback: 'Check your connection and try again.',
  });
  if (/pull down to refresh/i.test(safe)) {
    return 'Check your connection and try again.';
  }
  return safe;
}

/**
 * Centered empty / error for Payments → Transactions.
 * Same language as Bookings / Sent Texts / QR: icon ring, short title, one line of help.
 *
 * @param {{
 *   title: string;
 *   detail?: string;
 *   iconName?: import('@expo/vector-icons/Ionicons').IconProps['name'];
 *   actionLabel?: string;
 *   actionHint?: string;
 *   onAction?: () => void;
 *   compact?: boolean;
 * }} props
 */
export function PaymentsTransactionsMessage({
  title,
  detail,
  iconName = 'receipt-outline',
  actionLabel,
  actionHint,
  onAction,
  compact = false,
}) {
  const { colors } = useTheme();
  const safeDetail = detail ? friendlyDetail(detail) : '';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignItems: 'center',
          alignSelf: 'stretch',
          flexGrow: compact ? 0 : 1,
          justifyContent: 'center',
          paddingBottom: compact ? 28 : 48,
          paddingHorizontal: 28,
          paddingTop: compact ? 28 : 32,
        },
        iconRing: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderRadius: 999,
          height: 72,
          justifyContent: 'center',
          marginBottom: 18,
          width: 72,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 18,
          fontWeight: '600',
          letterSpacing: -0.3,
          textAlign: 'center',
        },
        detail: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 22,
          marginTop: 8,
          maxWidth: 300,
          textAlign: 'center',
        },
        action: {
          marginTop: 22,
          minWidth: 160,
        },
      }),
    [colors, compact],
  );

  return (
    <View style={styles.root}>
      <View style={styles.iconRing}>
        <Ionicons color={colors.textMuted} name={iconName} size={30} />
      </View>
      <AppText style={styles.title}>{title}</AppText>
      {safeDetail ? <AppText style={styles.detail}>{safeDetail}</AppText> : null}
      {actionLabel && onAction ? (
        <Button
          accessibilityHint={actionHint}
          accessibilityLabel={actionLabel}
          style={styles.action}
          title={actionLabel}
          variant="secondary"
          onPress={onAction}
        />
      ) : null}
    </View>
  );
}
