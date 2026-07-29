import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

const DELETE_ICON = '#f87171';

/**
 * Quiet Uber-style stop rows for vehicles already committed while adding another.
 * No titles — just the line + trash. Back discards the in-progress add.
 *
 * @param {{
 *   jobs: Array<{ localId?: string; serviceName?: string; vehicleLine?: string; priceLabel?: string }>;
 *   onCancelNewJob?: () => void;
 *   onRemoveJob?: (localId: string) => void;
 * }} props
 */
export function CommittedJobsBanner({ jobs, onCancelNewJob, onRemoveJob }) {
  const { colors, isDark } = useTheme();
  const list = Array.isArray(jobs) ? jobs : [];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          gap: 8,
        },
        row: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          borderRadius: 14,
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
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
        },
        meta: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
        },
        trailing: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
        },
        price: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '600',
        },
        trashHit: {
          alignItems: 'center',
          height: 32,
          justifyContent: 'center',
          width: 32,
        },
      }),
    [colors, isDark],
  );

  if (list.length === 0) return null;

  function confirmRemove(job, index) {
    const name = String(job?.serviceName ?? '').trim() || `Vehicle ${index + 1}`;
    const canRemoveLine = typeof onRemoveJob === 'function' && job?.localId;
    const action = canRemoveLine ? () => onRemoveJob(job.localId) : onCancelNewJob;

    if (!action) return;

    Alert.alert('Remove?', name, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: action },
    ]);
  }

  return (
    <View style={styles.root}>
      {list.map((job, index) => {
        const vehicleLine = String(job.vehicleLine ?? '').trim();
        const priceLabel = String(job.priceLabel ?? '').trim();
        const serviceName = String(job.serviceName ?? '').trim() || 'Service';

        return (
          <View key={job.localId ?? `committed-${index}`} style={styles.row}>
            <View style={styles.copy}>
              <AppText numberOfLines={1} style={styles.title}>
                {serviceName}
              </AppText>
              {vehicleLine ? (
                <AppText numberOfLines={1} style={styles.meta}>
                  {vehicleLine}
                </AppText>
              ) : null}
            </View>
            <View style={styles.trailing}>
              {priceLabel ? <AppText style={styles.price}>{priceLabel}</AppText> : null}
              <Pressable
                accessibilityLabel={`Remove ${serviceName}`}
                accessibilityRole="button"
                hitSlop={8}
                style={styles.trashHit}
                onPress={() => confirmRemove(job, index)}
              >
                <Ionicons color={DELETE_ICON} name="trash-outline" size={18} />
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}
