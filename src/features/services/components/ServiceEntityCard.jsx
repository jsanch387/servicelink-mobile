import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Switch, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import {
  SERVICE_CARD_TITLE_FONT_SIZE,
  SERVICE_CARD_TITLE_SYSTEM_FONT,
} from '../../../utils/serviceCardTypography';
const EDIT_ACCENT = '#34d399';
const DELETE_ACCENT = '#fb7185';
const DESCRIPTION_PREVIEW_CHARS = 100;

export function ServiceEntityCard({
  index,
  item,
  isSortMode,
  onToggleEnabled,
  onEdit,
  onDelete,
  onDragStart,
  isDragActive = false,
  showDescription = true,
  showToggle = true,
  showPriceCaption = true,
  showHeaderDivider = true,
  metaUnderTitle = false,
  metaLabelOverride,
  fullWidthActions = false,
  deleteDisabled = false,
  toggleDisabled = false,
}) {
  const { colors } = useTheme();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const dragPulse = useRef(new Animated.Value(0.72)).current;
  const description = item.description?.trim() ?? '';
  const isLongDescription = description.length > DESCRIPTION_PREVIEW_CHARS;
  const metaLabel =
    metaLabelOverride ??
    (item.addonsCountLabel
      ? `${item.durationLabel} · ${item.addonsCountLabel}`
      : item.durationLabel);
  const previewDescription = useMemo(() => {
    if (!isLongDescription || isDescriptionExpanded) {
      return description;
    }
    return `${description.slice(0, DESCRIPTION_PREVIEW_CHARS).trimEnd()}...`;
  }, [description, isDescriptionExpanded, isLongDescription]);

  useEffect(() => {
    if (!isSortMode) {
      dragPulse.stopAnimation();
      dragPulse.setValue(0.72);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(dragPulse, {
          duration: 700,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(dragPulse, {
          duration: 700,
          toValue: 0.72,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [dragPulse, isSortMode]);

  function handleSortLongPress() {
    if (!isSortMode) return;
    // Small native-feeling tactile tick when drag starts.
    Haptics.selectionAsync().catch(() => {});
    onDragStart?.();
  }

  const cardBody = (
    <View style={styles.outerRow}>
      {isSortMode ? (
        <View style={styles.reorderCol}>
          <AppText style={[styles.orderText, { color: colors.text }]}>{index + 1}</AppText>
          <View style={styles.dragPill}>
            <Animated.View style={{ opacity: dragPulse }}>
              <Ionicons color="#22c55e" name="reorder-three-outline" size={18} />
            </Animated.View>
            <AppText style={styles.dragLabel}>Hold</AppText>
          </View>
        </View>
      ) : null}

      <View style={styles.contentCol}>
        <View style={styles.headerRow}>
          <View style={styles.titleWrap}>
            <AppText numberOfLines={1} style={[styles.name, { color: colors.text }]}>
              {item.name}
            </AppText>
            {metaUnderTitle && metaLabel ? (
              <AppText style={[styles.metaInline, { color: colors.textMuted }]}>
                {metaLabel}
              </AppText>
            ) : null}
          </View>
          <View style={styles.priceWrap}>
            {showPriceCaption ? (
              <AppText style={[styles.priceCaption, { color: colors.textMuted }]}>
                Starting at
              </AppText>
            ) : null}
            <AppText style={[styles.price, { color: colors.text }]}>{item.priceLabel}</AppText>
          </View>
        </View>

        {showHeaderDivider ? (
          <View style={[styles.headerDivider, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
        ) : null}

        {!metaUnderTitle && !isSortMode ? (
          <View style={styles.metaRow}>
            <AppText style={[styles.meta, { color: colors.textMuted }]}>{metaLabel}</AppText>
          </View>
        ) : null}

        {showDescription ? (
          <View style={styles.descriptionWrap}>
            <AppText style={[styles.description, { color: colors.textMuted }]}>
              {previewDescription}
            </AppText>
            {isLongDescription ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsDescriptionExpanded((value) => !value)}
                style={styles.seeMoreRow}
              >
                <Ionicons
                  color={colors.textMuted}
                  name={isDescriptionExpanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                />
                <AppText style={[styles.seeMoreText, { color: colors.textMuted }]}>
                  {isDescriptionExpanded ? 'See less' : 'See more'}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {!isSortMode ? (
          <View
            style={[
              styles.bottomRow,
              fullWidthActions ? styles.bottomRowWide : styles.bottomRowCompact,
            ]}
          >
            <View
              style={[
                styles.actionButtonsRow,
                fullWidthActions ? styles.actionButtonsRowWide : styles.actionButtonsRowCompact,
              ]}
            >
              <Pressable
                accessibilityRole="button"
                onPress={onEdit}
                style={[
                  styles.actionButton,
                  fullWidthActions ? styles.actionButtonWide : styles.actionButtonCompact,
                  { borderColor: 'rgba(255,255,255,0.2)' },
                ]}
              >
                <Ionicons color={EDIT_ACCENT} name="create-outline" size={16} />
                <AppText
                  style={[
                    styles.actionText,
                    fullWidthActions ? styles.actionTextWide : styles.actionTextCompact,
                    { color: EDIT_ACCENT },
                  ]}
                >
                  Edit
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={deleteDisabled}
                onPress={onDelete}
                style={[
                  styles.actionButton,
                  fullWidthActions ? styles.actionButtonWide : styles.actionButtonCompact,
                  { borderColor: 'rgba(255,255,255,0.2)' },
                ]}
              >
                <Ionicons color={DELETE_ACCENT} name="trash-outline" size={16} />
                <AppText
                  style={[
                    styles.actionText,
                    fullWidthActions ? styles.actionTextWide : styles.actionTextCompact,
                    { color: DELETE_ACCENT },
                  ]}
                >
                  Delete
                </AppText>
              </Pressable>
            </View>

            {showToggle ? (
              <View style={styles.toggleWrap}>
                <Switch
                  disabled={toggleDisabled}
                  onValueChange={onToggleEnabled}
                  thumbColor={item.isEnabled ? '#f8fafc' : '#f4f4f5'}
                  trackColor={{ false: colors.borderStrong, true: '#10b981' }}
                  value={item.isEnabled}
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <SurfaceCard
      padding="none"
      style={[
        styles.card,
        { borderColor: colors.border },
        isSortMode && {
          backgroundColor: colors.shellElevated,
          borderColor: 'rgba(34,197,94,0.45)',
          borderStyle: 'dashed',
        },
        isDragActive && { transform: [{ scale: 1.01 }], opacity: 0.92 },
      ]}
    >
      {isSortMode ? (
        <Pressable
          accessibilityRole="button"
          delayLongPress={120}
          onLongPress={handleSortLongPress}
          style={styles.sortModePressable}
        >
          {cardBody}
        </Pressable>
      ) : (
        cardBody
      )}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  outerRow: {
    flexDirection: 'row',
  },
  sortModePressable: {
    width: '100%',
  },
  reorderCol: {
    alignItems: 'center',
    marginRight: 10,
    paddingTop: 4,
    width: 40,
  },
  orderText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  dragPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 46,
    minWidth: 34,
    paddingVertical: 6,
  },
  dragLabel: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  contentCol: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontFamily: SERVICE_CARD_TITLE_SYSTEM_FONT,
    fontSize: SERVICE_CARD_TITLE_FONT_SIZE,
    fontWeight: '900',
    marginBottom: 4,
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  priceCaption: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 3,
  },
  price: {
    fontFamily: SERVICE_CARD_TITLE_SYSTEM_FONT,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
  },
  headerDivider: {
    height: 1,
    marginBottom: 10,
    marginTop: 6,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  meta: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: '500',
  },
  metaInline: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  descriptionWrap: {
    minHeight: 72,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
  },
  seeMoreRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: -4,
    marginTop: 4,
    minHeight: 34,
    paddingHorizontal: 4,
  },
  seeMoreText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomRowCompact: {
    marginTop: 10,
  },
  bottomRowWide: {
    marginTop: 14,
  },
  actionButtonsRow: {
    flexDirection: 'row',
  },
  actionButtonsRowCompact: {
    maxWidth: 240,
  },
  actionButtonsRowWide: {
    flex: 1,
    gap: 8,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 42,
    paddingHorizontal: 18,
  },
  actionButtonCompact: {
    marginRight: 8,
    minWidth: 86,
  },
  actionButtonWide: {
    flex: 1,
    flexBasis: 0,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
  },
  actionTextCompact: {
    textAlign: 'left',
  },
  actionTextWide: {
    textAlign: 'center',
  },
  toggleWrap: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.35,
  },
});
