import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Divider } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/**
 * Receipt-style multi-job price lines for Complete visit Payment.
 * Flush left columns — service and add-ons share the same edge (no indent).
 *
 * @param {{
 *   jobs: Array<{
 *     id?: string;
 *     serviceName?: string;
 *     servicePrice?: number;
 *     addOns?: Array<{ id?: string; name?: string; price?: number }>;
 *   }>;
 *   formatUsd: (amount: number) => string;
 * }} props
 */
export function CompleteVisitJobsBreakdown({ jobs, formatUsd }) {
  const { colors } = useTheme();
  const list = Array.isArray(jobs) ? jobs : [];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          gap: 0,
        },
        jobBlock: {
          gap: 8,
          paddingBottom: 12,
          paddingTop: 12,
        },
        jobBlockFirst: {
          paddingTop: 0,
        },
        jobBlockLast: {
          paddingBottom: 0,
        },
        lineRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        serviceLabel: {
          color: colors.text,
          flex: 1,
          fontSize: 15,
          fontWeight: '600',
          marginRight: 12,
        },
        serviceValue: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          textAlign: 'right',
        },
        addonLabel: {
          color: colors.textMuted,
          flex: 1,
          fontSize: 14,
          marginRight: 12,
        },
        addonValue: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '400',
          textAlign: 'right',
        },
        jobDivider: {
          marginTop: 0,
        },
      }),
    [colors],
  );

  if (list.length === 0) return null;

  return (
    <View style={styles.stack}>
      {list.map((job, index) => {
        const addonRows = job.addOns ?? [];
        const isFirst = index === 0;
        const isLast = index === list.length - 1;
        return (
          <View key={job.id ?? `complete-job-${index}`}>
            {!isFirst ? <Divider style={styles.jobDivider} /> : null}
            <View
              style={[
                styles.jobBlock,
                isFirst ? styles.jobBlockFirst : null,
                isLast ? styles.jobBlockLast : null,
              ]}
            >
              <View style={styles.lineRow}>
                <AppText numberOfLines={2} style={styles.serviceLabel}>
                  {job.serviceName || '—'}
                </AppText>
                <AppText style={styles.serviceValue}>{formatUsd(job.servicePrice ?? 0)}</AppText>
              </View>
              {addonRows.map((addon, addonIndex) => (
                <View
                  key={String(addon.id ?? `${index}-addon-${addonIndex}`)}
                  style={styles.lineRow}
                >
                  <AppText numberOfLines={2} style={styles.addonLabel}>
                    {addon.name}
                  </AppText>
                  <AppText style={styles.addonValue}>{formatUsd(addon.price ?? 0)}</AppText>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}
