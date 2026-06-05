import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import {
  SERVICE_CARD_TITLE_FONT_SIZE,
  SERVICE_CARD_TITLE_SYSTEM_FONT,
} from '../../../utils/serviceCardTypography';

const EDIT_ACCENT = '#34d399';
const DELETE_ACCENT = '#fb7185';

/**
 * Individual card for Categories and Add-ons tabs — name, meta, Edit / Delete actions.
 *
 * Add-ons: pass `priceLabel` to pin cost on the right (service-card style); use `metaLines`
 * for duration only. Categories: omit `priceLabel` and pass service count in `metaLines`.
 */
export function CatalogEntityCard({
  name,
  metaLines = [],
  priceLabel,
  onEdit,
  onDelete,
  deleteDisabled = false,
}) {
  const { colors } = useTheme();
  const hasPrice = Boolean(priceLabel?.trim());

  return (
    <SurfaceCard padding="none" style={[styles.card, { borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <AppText numberOfLines={2} style={[styles.title, { color: colors.text }]}>
            {name}
          </AppText>
          {metaLines.map((line, index) => (
            <AppText
              key={`${line}-${index}`}
              numberOfLines={1}
              style={[styles.metaLine, { color: colors.textMuted }]}
            >
              {line}
            </AppText>
          ))}
        </View>
        {hasPrice ? (
          <AppText style={[styles.price, { color: colors.text }]}>{priceLabel}</AppText>
        ) : null}
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          onPress={onEdit}
          style={[styles.actionButton, { borderColor: 'rgba(255,255,255,0.2)' }]}
        >
          <Ionicons color={EDIT_ACCENT} name="create-outline" size={16} />
          <AppText style={[styles.actionText, { color: EDIT_ACCENT }]}>Edit</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={deleteDisabled}
          onPress={onDelete}
          style={[
            styles.actionButton,
            { borderColor: 'rgba(255,255,255,0.2)' },
            deleteDisabled && styles.actionButtonDisabled,
          ]}
        >
          <Ionicons color={DELETE_ACCENT} name="trash-outline" size={16} />
          <AppText style={[styles.actionText, { color: DELETE_ACCENT }]}>Delete</AppText>
        </Pressable>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  metaLine: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
    lineHeight: 18,
    marginTop: 4,
  },
  price: {
    fontFamily: SERVICE_CARD_TITLE_SYSTEM_FONT,
    fontSize: SERVICE_CARD_TITLE_FONT_SIZE,
    fontWeight: '900',
    lineHeight: 22,
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 12,
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
});
