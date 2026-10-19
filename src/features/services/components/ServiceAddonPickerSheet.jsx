import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button, SkeletonBox } from '../../../components/ui';
import { formatAddonDurationFromHHmm } from '../../../components/ui/durationTime';
import { useTheme } from '../../../theme';

function SheetListSkeleton({ rows = 5 }) {
  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: rows }, (_, index) => (
        <View key={`addon-skel-${index}`} style={styles.skeletonRow}>
          <SkeletonBox borderRadius={11} height={22} pulse width={22} />
          <View style={styles.skeletonCopy}>
            <SkeletonBox borderRadius={6} height={14} pulse width="54%" />
            <SkeletonBox borderRadius={6} height={11} pulse width="28%" />
          </View>
          <SkeletonBox borderRadius={6} height={14} pulse width={44} />
        </View>
      ))}
    </View>
  );
}

function catalogAddonMeta(addon) {
  return {
    price: addon?.priceLabel || '',
    duration: addon?.durationLabel || '',
  };
}

function pendingAddonMeta(addon) {
  const price = String(addon?.price ?? '').trim();
  return {
    price: price ? `+$${price}` : '',
    duration: formatAddonDurationFromHHmm(addon?.durationHHmm),
  };
}

export function summarizeSelectedAddons({ catalogAddons, pendingAddons, selectedAddonIds }) {
  const catalogCount = (catalogAddons ?? []).filter((addon) =>
    selectedAddonIds.includes(addon.id),
  ).length;
  const pendingCount = (pendingAddons ?? []).filter((addon) => addon.selected).length;
  const count = catalogCount + pendingCount;
  if (count === 0) return 'None';
  if (count === 1) return '1 add-on';
  return `${count} add-ons`;
}

/**
 * One row on the new-service screen. Opens the add-on picker.
 */
export function ServiceAddonSummaryRow({ summary, onPress }) {
  const { colors } = useTheme();

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {({ pressed }) => (
        <View
          style={[styles.summaryRow, pressed && { backgroundColor: colors.buttonGhostPressed }]}
        >
          <View style={styles.summaryLabelCol}>
            <AppText style={[styles.summaryTitle, { color: colors.text }]}>Add-ons</AppText>
            <AppText numberOfLines={1} style={[styles.summaryMeta, { color: colors.textMuted }]}>
              {summary}
            </AppText>
          </View>
          <View style={styles.chevronCol}>
            <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
          </View>
        </View>
      )}
    </Pressable>
  );
}

function AddonChoiceRow({ title, price, duration, selected, onPress, showDivider }) {
  const { colors } = useTheme();

  return (
    <View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        android_ripple={null}
        onPress={onPress}
      >
        <View style={styles.choiceRow}>
          <View style={styles.markCol}>
            <View
              style={[
                styles.mark,
                {
                  backgroundColor: selected ? '#ffffff' : 'transparent',
                  borderColor: selected ? '#ffffff' : colors.borderStrong,
                },
              ]}
            >
              {selected ? <Ionicons color="#000000" name="checkmark" size={14} /> : null}
            </View>
          </View>
          <View style={styles.choiceLabelCol}>
            <AppText numberOfLines={1} style={[styles.choiceTitle, { color: colors.text }]}>
              {title}
            </AppText>
            {duration ? (
              <AppText numberOfLines={1} style={[styles.choiceMeta, { color: colors.textMuted }]}>
                {duration}
              </AppText>
            ) : null}
          </View>
          {price ? (
            <View style={styles.priceCol}>
              <AppText numberOfLines={1} style={[styles.price, { color: colors.text }]}>
                {price}
              </AppText>
            </View>
          ) : null}
        </View>
      </Pressable>
      {showDivider ? (
        <View style={styles.dividerRow}>
          <View style={[styles.hairline, { backgroundColor: colors.border }]} />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Choose which add-ons belong on this service. Tap a row to include it.
 */
export function ServiceAddonPickerSheet({
  visible,
  catalogAddons,
  pendingAddons,
  selectedAddonIds,
  loading = false,
  onToggleCatalog,
  onTogglePending,
  onAdd,
  onRequestClose,
}) {
  const addons = catalogAddons ?? [];
  const pending = pendingAddons ?? [];
  const rowCount = addons.length + pending.length;

  return (
    <BottomSheetModal
      allowBackdropClose
      sheetHeightPercent={68}
      stickyFooter
      title="Add-ons"
      visible={visible}
      footer={
        <View style={styles.listActions}>
          <Button
            disabled={loading}
            fullWidth
            iconName="add"
            title="Add an add-on"
            variant="secondary"
            onPress={onAdd}
          />
          <Button
            disabled={loading}
            fullWidth
            title="Done"
            variant="surfaceLight"
            onPress={onRequestClose}
          />
        </View>
      }
      onRequestClose={onRequestClose}
    >
      {loading ? (
        <SheetListSkeleton />
      ) : (
        <View style={styles.list}>
          {addons.map((addon, index) => {
            const meta = catalogAddonMeta(addon);
            return (
              <AddonChoiceRow
                key={addon.id}
                duration={meta.duration}
                price={meta.price}
                selected={selectedAddonIds.includes(addon.id)}
                showDivider={index < rowCount - 1}
                title={addon.name}
                onPress={() => onToggleCatalog(addon.id)}
              />
            );
          })}
          {pending.map((addon, index) => {
            const meta = pendingAddonMeta(addon);
            return (
              <AddonChoiceRow
                key={addon.localId}
                duration={meta.duration}
                price={meta.price}
                selected={addon.selected}
                showDivider={addons.length + index < rowCount - 1}
                title={addon.name}
                onPress={() => onTogglePending(addon.localId)}
              />
            );
          })}
        </View>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
  },
  summaryLabelCol: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  summaryMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  chevronCol: {
    alignItems: 'center',
    height: 22,
    justifyContent: 'center',
    marginLeft: 8,
    width: 22,
  },
  list: {
    marginHorizontal: -16,
  },
  skeletonList: {
    gap: 4,
    marginHorizontal: -16,
  },
  skeletonRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  skeletonCopy: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  choiceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  markCol: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    marginRight: 12,
    width: 28,
  },
  mark: {
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  choiceLabelCol: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  choiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  choiceMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  priceCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 12,
    maxWidth: 96,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  dividerRow: {
    paddingHorizontal: 16,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.55,
  },
  listActions: {
    gap: 10,
  },
});
