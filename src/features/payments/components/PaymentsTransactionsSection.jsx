import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, FrostedIconWell, LoadMoreLink } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { usePaymentsTransactions } from '../hooks/usePaymentsTransactions';
import { groupPaymentsTransactionsByDate } from '../utils/groupPaymentsTransactionsByDate';
import { presentPaymentsTransactionRow } from '../utils/presentPaymentsTransactionRow';
import { isGenericMultiJobTitle } from '../utils/splitPaymentsTransactionTitle';
import { PaymentsTransactionsBalance } from './PaymentsTransactionsBalance';
import { PaymentsTransactionsMessage } from './PaymentsTransactionsMessage';
import { PaymentsTransactionsSkeleton } from './PaymentsTransactionsSkeleton';

function rowIcon(item) {
  if (item.kind === 'refund') return { icon: 'return-down-back' };
  if (item.source === 'tap_to_pay') return { icon: 'phone-portrait' };
  if (item.source === 'payment_link') return { icon: 'link' };
  if (item.source === 'booking') return { icon: 'card' };
  if (item.source === 'membership') return { icon: 'repeat' };
  if (item.source === 'payout') return { icon: 'arrow-down-circle' };
  if (item.source === 'cash') return { icon: 'cash-multiple', iconLibrary: 'material-community' };
  if (item.source === 'payment_app') return { icon: 'wallet' };
  if (item.source === 'other') return { icon: 'ellipse' };
  return { icon: 'receipt' };
}

function rowIconColor(item, colors) {
  if (item.kind === 'refund' || item.tone === 'out') {
    return colors.danger;
  }
  return '#ffffff';
}

/**
 * Payments → Transactions. Paints server labels (do not reformat amounts).
 */
export function PaymentsTransactionsSection() {
  const { colors } = useTheme();
  const feed = usePaymentsTransactions();

  const groups = useMemo(() => groupPaymentsTransactionsByDate(feed.items), [feed.items]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          flexGrow: 1,
          gap: 16,
        },
        list: {
          gap: 0,
        },
        dayHead: {
          paddingBottom: 4,
          paddingTop: 4,
        },
        dayHeadLater: {
          paddingTop: 18,
        },
        dayLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingVertical: 13,
          width: '100%',
        },
        copy: {
          flex: 1,
          gap: 3,
          minWidth: 0,
          paddingHorizontal: 12,
        },
        titleRow: {
          alignItems: 'baseline',
          flexDirection: 'row',
          maxWidth: '100%',
        },
        titleCol: {
          flexShrink: 1,
          minWidth: 0,
          overflow: 'hidden',
        },
        moreCol: {
          flexShrink: 0,
          marginLeft: 6,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.15,
        },
        more: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: -0.05,
        },
        subtitle: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
        },
        amountCol: {
          alignItems: 'flex-end',
          flexShrink: 0,
          justifyContent: 'center',
        },
        amountIn: {
          color: '#ffffff',
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 15,
          fontWeight: '700',
        },
        amountOut: {
          color: colors.danger,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          fontWeight: '600',
        },
        amountPayout: {
          color: '#ffffff',
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 15,
          fontWeight: '700',
        },
        fee: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 11,
          fontWeight: '500',
          marginTop: 3,
        },
      }),
    [colors],
  );

  if (feed.isLoading) {
    return <PaymentsTransactionsSkeleton />;
  }

  if (feed.errorMessage && feed.items.length === 0) {
    return (
      <View style={styles.stack} testID="payments-transactions">
        <PaymentsTransactionsMessage
          actionHint="Attempts to load transactions again"
          actionLabel="Try again"
          detail={feed.errorMessage}
          iconName="cloud-offline-outline"
          title="Couldn't load transactions"
          onAction={() => void feed.refetch()}
        />
      </View>
    );
  }

  return (
    <View style={styles.stack} testID="payments-transactions">
      <PaymentsTransactionsBalance
        availableCaption={feed.balance.availableCaption}
        availableLabel={feed.balance.availableLabel}
        pendingCaption={feed.balance.pendingCaption}
        pendingLabel={feed.balance.pendingLabel}
      />

      {feed.items.length === 0 ? (
        <PaymentsTransactionsMessage
          compact
          detail="Paid jobs and bank payouts show up here."
          title="No transactions yet"
        />
      ) : (
        <View style={styles.list}>
          {groups.map((group, groupIndex) => (
            <View key={`${group.dateLabel}-${groupIndex}`}>
              {group.dateLabel ? (
                <View style={[styles.dayHead, groupIndex > 0 && styles.dayHeadLater]}>
                  <AppText style={styles.dayLabel}>{group.dateLabel}</AppText>
                </View>
              ) : null}
              {group.items.map((item) => {
                const amountStyle =
                  item.tone === 'out'
                    ? styles.amountOut
                    : item.tone === 'payout'
                      ? styles.amountPayout
                      : styles.amountIn;
                const presented = presentPaymentsTransactionRow(item);
                const glyph = rowIcon(item);
                const primary = isGenericMultiJobTitle(presented.primary) ? '' : presented.primary;
                const extraLabel = presented.extraLabel;
                const subtitle = isGenericMultiJobTitle(presented.subtitle)
                  ? ''
                  : presented.subtitle;
                return (
                  <View key={item.id} style={styles.row}>
                    <FrostedIconWell
                      color={rowIconColor(item, colors)}
                      icon={glyph.icon}
                      iconLibrary={glyph.iconLibrary}
                    />
                    <View style={styles.copy}>
                      {primary || extraLabel ? (
                        <View style={styles.titleRow}>
                          {primary ? (
                            <View style={styles.titleCol}>
                              <AppText ellipsizeMode="tail" numberOfLines={1} style={styles.title}>
                                {primary}
                              </AppText>
                            </View>
                          ) : null}
                          {extraLabel ? (
                            <View style={styles.moreCol}>
                              <AppText numberOfLines={1} style={styles.more}>
                                {extraLabel}
                              </AppText>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                      {subtitle ? (
                        <AppText ellipsizeMode="tail" numberOfLines={1} style={styles.subtitle}>
                          {subtitle}
                        </AppText>
                      ) : null}
                    </View>
                    <View style={styles.amountCol}>
                      {item.amountLabel ? (
                        <AppText style={amountStyle}>{item.amountLabel}</AppText>
                      ) : null}
                      {item.feeLabel ? <AppText style={styles.fee}>{item.feeLabel}</AppText> : null}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}

      {feed.hasMore && feed.items.length > 0 ? (
        <LoadMoreLink
          accessibilityHint="Shows older transactions"
          label="Show more"
          loading={feed.isFetchingMore}
          onPress={feed.fetchMore}
        />
      ) : null}
    </View>
  );
}
