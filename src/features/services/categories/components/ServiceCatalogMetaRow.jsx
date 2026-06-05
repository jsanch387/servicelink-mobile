import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/**
 * Quiet list meta: service count on the left, optional Reorder link on the right.
 */
export function ServiceCatalogMetaRow({ countLabel, showReorder, disabled, onReorder }) {
  const { colors } = useTheme();

  if (!countLabel && !showReorder) return null;

  return (
    <View style={styles.row}>
      <AppText style={[styles.count, { color: colors.textMuted }]}>{countLabel}</AppText>
      {showReorder ? (
        <Pressable
          accessibilityLabel="Reorder services"
          accessibilityRole="button"
          disabled={disabled}
          hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
          onPress={onReorder}
          style={({ pressed }) => [
            styles.reorderHit,
            (pressed || disabled) && styles.reorderHitPressed,
          ]}
        >
          <View style={styles.reorderRow}>
            <Ionicons color={colors.textSecondary} name="swap-vertical-outline" size={15} />
            <AppText style={[styles.reorderLink, { color: colors.textSecondary }]}>Reorder</AppText>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 0,
    minHeight: 22,
  },
  count: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
    marginRight: 12,
  },
  reorderHit: {
    paddingVertical: 2,
  },
  reorderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  reorderHitPressed: {
    opacity: 0.55,
  },
  reorderLink: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
    textDecorationLine: 'underline',
  },
});
