import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

export function SelectableAddonCard({
  addon,
  selected,
  onToggle,
  onEdit,
  onDelete,
  deleteDisabled = false,
}) {
  const { colors } = useTheme();
  const metaLine = [addon.priceLabel, addon.durationLabel].filter(Boolean).join(' · ');

  return (
    <SurfaceCard padding="none" style={[styles.card, { borderColor: colors.border }]}>
      <View style={styles.row}>
        <Pressable
          accessibilityLabel="Delete add-on"
          accessibilityRole="button"
          disabled={deleteDisabled}
          hitSlop={10}
          onPress={onDelete}
          style={styles.trashHit}
        >
          <Ionicons color="#fb7185" name="trash-outline" size={20} />
        </Pressable>

        <Pressable accessibilityRole="button" onPress={onEdit} style={styles.editHit}>
          <View style={styles.main}>
            <AppText style={[styles.title, { color: colors.text }]}>{addon.name}</AppText>
            <AppText style={[styles.meta, { color: colors.textMuted }]}>{metaLine}</AppText>
          </View>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={22} />
        </Pressable>

        <Pressable
          accessibilityLabel={selected ? 'Remove add-on from service' : 'Add add-on to service'}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onToggle}
          style={styles.checkboxHit}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: selected ? 'rgba(255,255,255,0.10)' : 'transparent',
                borderColor: selected ? 'rgba(255,255,255,0.30)' : colors.borderStrong,
              },
            ]}
          >
            {selected ? (
              <Ionicons color="rgba(255,255,255,0.92)" name="checkmark" size={14} />
            ) : null}
          </View>
        </Pressable>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    minHeight: 56,
  },
  trashHit: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    paddingRight: 2,
  },
  editHit: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingRight: 4,
  },
  main: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkboxHit: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
});
