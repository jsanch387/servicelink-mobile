import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, LoadMoreLink, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  PAYMENTS_TRANSACTIONS_MOCK,
  PAYMENTS_TRANSACTIONS_PAGE_SIZE,
} from '../constants/paymentsTransactionsMockData';

function formatUsd(cents) {
  const abs = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(cents) / 100);
  return cents < 0 ? `−${abs}` : `+${abs}`;
}

function methodIcon(method) {
  if (method === 'tap') return 'phone-portrait-outline';
  if (method === 'link') return 'link-outline';
  if (method === 'online') return 'globe-outline';
  if (method === 'payout') return 'business-outline';
  return 'cash-outline';
}

function groupRowsByDay(rows) {
  /** @type {Map<string, typeof PAYMENTS_TRANSACTIONS_MOCK>} */
  const map = new Map();
  for (const row of rows) {
    const list = map.get(row.dayGroup) ?? [];
    list.push(row);
    map.set(row.dayGroup, list);
  }
  return Array.from(map.entries()).map(([dayGroup, groupRows]) => ({
    dayGroup,
    rows: groupRows,
  }));
}

/**
 * Payments → Transactions. Mock rows only — newest first, paged.
 */
export function PaymentsTransactionsSection() {
  const { colors, isDark } = useTheme();
  const [visibleCount, setVisibleCount] = useState(PAYMENTS_TRANSACTIONS_PAGE_SIZE);

  const groups = useMemo(
    () => groupRowsByDay(PAYMENTS_TRANSACTIONS_MOCK.slice(0, visibleCount)),
    [visibleCount],
  );
  const hasMore = visibleCount < PAYMENTS_TRANSACTIONS_MOCK.length;

  const handleShowMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAYMENTS_TRANSACTIONS_PAGE_SIZE);
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          gap: 16,
        },
        intro: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginTop: -4,
        },
        group: {
          gap: 8,
        },
        groupTitle: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.1,
          paddingHorizontal: 2,
        },
        listCard: {
          gap: 0,
          overflow: 'hidden',
          paddingVertical: 2,
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 4,
          paddingVertical: 14,
          width: '100%',
        },
        rowDivider: {
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        iconWrap: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.buttonSecondaryBg,
          borderRadius: 12,
          height: 40,
          justifyContent: 'center',
          width: 40,
        },
        copy: {
          flex: 1,
          gap: 2,
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.15,
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
        },
        amountCol: {
          alignItems: 'flex-end',
          justifyContent: 'center',
        },
        amountIn: {
          color: colors.moneyPositive,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          fontWeight: '600',
        },
        amountOut: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          fontWeight: '600',
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.stack} testID="payments-transactions">
      <AppText style={styles.intro}>Newest first. Paid links and in-person charges show here.</AppText>

      {groups.map((group) => (
        <View key={group.dayGroup} style={styles.group}>
          <AppText style={styles.groupTitle}>{group.dayGroup}</AppText>
          <SurfaceCard padding="sm" style={styles.listCard}>
            {group.rows.map((row, index) => (
              <View key={row.id} style={[styles.row, index > 0 && styles.rowDivider]}>
                <View style={styles.iconWrap}>
                  <Ionicons color={colors.textMuted} name={methodIcon(row.method)} size={18} />
                </View>
                <View style={styles.copy}>
                  <AppText numberOfLines={1} style={styles.title}>
                    {row.title}
                  </AppText>
                  <AppText numberOfLines={1} style={styles.subtitle}>
                    {row.subtitle}
                  </AppText>
                </View>
                <View style={styles.amountCol}>
                  <AppText style={row.tone === 'in' ? styles.amountIn : styles.amountOut}>
                    {formatUsd(row.amountCents)}
                  </AppText>
                </View>
              </View>
            ))}
          </SurfaceCard>
        </View>
      ))}

      {hasMore ? (
        <LoadMoreLink
          accessibilityHint="Shows older transactions"
          label="Show more"
          onPress={handleShowMore}
        />
      ) : null}
    </View>
  );
}
