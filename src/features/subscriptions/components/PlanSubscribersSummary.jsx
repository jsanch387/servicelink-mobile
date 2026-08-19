import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

/**
 * Plan subscribers entry — empty message, or a single row into the list.
 *
 * @param {object} props
 * @param {number} [props.activeCount]
 * @param {number} [props.canceledCount]
 * @param {() => void} props.onPress
 */
export function PlanSubscribersSummary({ activeCount = 0, canceledCount = 0, onPress }) {
  const { colors } = useTheme();
  const active = Math.max(0, Math.round(Number(activeCount)) || 0);
  const canceled = Math.max(0, Math.round(Number(canceledCount)) || 0);
  const isEmpty = active === 0 && canceled === 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        empty: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.15,
          lineHeight: 21,
        },
        /**
         * Row layout on inner View — Pressable often ignores flexDirection: 'row'.
         */
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          marginVertical: -4,
          minHeight: 36,
          width: '100%',
        },
        iconCol: {
          alignItems: 'center',
          height: 22,
          justifyContent: 'center',
          width: 22,
        },
        labelCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        label: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 16,
          fontWeight: '500',
          letterSpacing: -0.2,
        },
        chevronCol: {
          alignItems: 'center',
          height: 22,
          justifyContent: 'center',
          width: 22,
        },
      }),
    [colors],
  );

  return (
    <DetailsSectionCard title="Subscribers">
      {isEmpty ? (
        <AppText style={styles.empty}>No subscribers yet</AppText>
      ) : (
        <Pressable
          accessibilityHint="Opens everyone on this subscription"
          accessibilityLabel="View subscribers"
          accessibilityRole="button"
          onPress={onPress}
        >
          {({ pressed }) => (
            <View style={[styles.row, pressed && { opacity: 0.75 }]}>
              <View style={styles.iconCol}>
                <Ionicons color={colors.accentMuted} name="people-outline" size={20} />
              </View>
              <View style={styles.labelCol}>
                <AppText numberOfLines={1} style={styles.label}>
                  View subscribers
                </AppText>
              </View>
              <View style={styles.chevronCol}>
                <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
              </View>
            </View>
          )}
        </Pressable>
      )}
    </DetailsSectionCard>
  );
}
