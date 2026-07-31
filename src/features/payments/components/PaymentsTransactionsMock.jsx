import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { PAYMENTS_TRANSACTIONS_MOCK } from '../constants/paymentsTransactionsMockData';

function formatUsd(cents) {
  const abs = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(cents) / 100);
  return cents < 0 ? `−${abs}` : `+${abs}`;
}

function methodIcon(method) {
  if (method === 'tap') return 'phone-portrait-outline';
  if (method === 'online') return 'globe-outline';
  if (method === 'payout') return 'business-outline';
  return 'cash-outline';
}

/**
 * Sample Transactions tab — money in and out, plain English (mock data only).
 */
export function PaymentsTransactionsMock() {
  const { colors, isDark } = useTheme();

  const groups = useMemo(() => {
    /** @type {Map<string, typeof PAYMENTS_TRANSACTIONS_MOCK>} */
    const map = new Map();
    for (const row of PAYMENTS_TRANSACTIONS_MOCK) {
      const list = map.get(row.dayGroup) ?? [];
      list.push(row);
      map.set(row.dayGroup, list);
    }
    return Array.from(map.entries()).map(([dayGroup, rows]) => ({ dayGroup, rows }));
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
    <View style={styles.stack}>
      <AppText style={styles.intro}>Every payment and payout, newest first.</AppText>

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
                <AppText style={row.tone === 'in' ? styles.amountIn : styles.amountOut}>
                  {formatUsd(row.amountCents)}
                </AppText>
              </View>
            ))}
          </SurfaceCard>
        </View>
      ))}
    </View>
  );
}
