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
          <Ionicons color="#fb7185" name="trash-outline" size={18} />
        </Pressable>

        <Pressable accessibilityRole="button" onPress={onEdit} style={styles.editHit}>
          <View style={styles.main}>
            <AppText numberOfLines={2} style={[styles.title, { color: colors.text }]}>
              {addon.name}
            </AppText>
            <AppText numberOfLines={1} style={[styles.meta, { color: colors.textMuted }]}>
              {metaLine}
            </AppText>
          </View>
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
              <Ionicons color="rgba(255,255,255,0.92)" name="checkmark" size={12} />
            ) : null}
          </View>
        </Pressable>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  row: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 4,
    minHeight: 48,
  },
  trashHit: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    width: 40,
  },
  editHit: {
    flex: 1,
    flexDirection: 'column',
    minWidth: 0,
    paddingRight: 2,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.15,
    lineHeight: 18,
    marginBottom: 1,
  },
  meta: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
  checkboxHit: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    width: 40,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
});
