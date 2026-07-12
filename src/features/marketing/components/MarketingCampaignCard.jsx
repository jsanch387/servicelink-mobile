import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { MARKETING_CAMPAIGN_KIND } from '../constants';
import {
  formatMarketingDateRangeShort,
  formatMarketingDiscountLabel,
  getMarketingCampaignDisplayStatus,
  isMarketingCampaignEnabled,
  marketingStatusLabel,
} from '../utils/marketingCampaignModel';

const EDIT_ACCENT = '#34d399';
const DELETE_ACCENT = '#fb7185';

/**
 * @param {object} props
 * @param {import('../utils/marketingCampaignModel').MarketingCampaign} props.campaign
 * @param {() => void} props.onEdit
 * @param {() => void} props.onDelete
 * @param {(enabled: boolean) => void} props.onToggleEnabled
 * @param {boolean} [props.actionsDisabled]
 */
export function MarketingCampaignCard({
  campaign,
  onEdit,
  onDelete,
  onToggleEnabled,
  actionsDisabled = false,
}) {
  const { colors, isDark } = useTheme();
  const isPromo = campaign.kind === MARKETING_CAMPAIGN_KIND.PROMO_CODE;
  const title = isPromo ? campaign.code : campaign.name;
  const enabled = isMarketingCampaignEnabled(campaign);
  const status = getMarketingCampaignDisplayStatus(campaign);
  const isLive = status === 'active';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          gap: 14,
          opacity: enabled ? 1 : 0.82,
        },
        headerRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 10,
        },
        title: {
          color: colors.text,
          flex: 1,
          fontSize: isPromo ? 17 : 16,
          fontWeight: '800',
          letterSpacing: isPromo ? 1.2 : -0.2,
          minWidth: 0,
        },
        titlePromo: {
          fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
        },
        pill: {
          backgroundColor: isLive
            ? isDark
              ? 'rgba(110, 231, 183, 0.12)'
              : 'rgba(4, 120, 87, 0.08)'
            : isDark
              ? 'rgba(163, 163, 163, 0.12)'
              : 'rgba(115, 115, 115, 0.1)',
          borderColor: isLive
            ? isDark
              ? 'rgba(110, 231, 183, 0.35)'
              : 'rgba(4, 120, 87, 0.22)'
            : colors.border,
          borderRadius: 999,
          borderWidth: 1,
          flexShrink: 0,
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        pillText: {
          color: isLive ? colors.textSuccess : colors.textMuted,
          fontSize: 11,
          fontWeight: '700',
        },
        infoSection: {
          gap: 10,
        },
        actionsDivider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginTop: 2,
        },
        infoRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
        },
        infoIcon: {
          width: 18,
        },
        infoLabel: {
          color: colors.textMuted,
          flex: 1,
          fontSize: 13,
          fontWeight: '500',
        },
        infoValue: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '700',
          textAlign: 'right',
        },
        bottomRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        actionGroup: {
          flexDirection: 'row',
          gap: 8,
        },
        actionButton: {
          alignItems: 'center',
          borderColor: colors.borderStrong,
          borderRadius: 12,
          borderWidth: 1,
          height: 44,
          justifyContent: 'center',
          minWidth: 73,
          paddingHorizontal: 18,
        },
        toggleWrap: {
          alignItems: 'center',
          height: 44,
          justifyContent: 'center',
          marginLeft: 16,
        },
      }),
    [colors, isDark, isLive, isPromo],
  );

  const discountLabel = formatMarketingDiscountLabel(campaign);
  const dateRange = formatMarketingDateRangeShort(
    campaign.startDateYyyyMmDd,
    campaign.endDateYyyyMmDd,
  );

  return (
    <SurfaceCard padding="md" style={styles.card}>
      <View style={styles.headerRow}>
        <AppText numberOfLines={2} style={[styles.title, isPromo && styles.titlePromo]}>
          {title}
        </AppText>
        <View style={styles.pill}>
          <AppText style={styles.pillText}>{marketingStatusLabel(status)}</AppText>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Ionicons
            color={colors.textMuted}
            name="pricetag-outline"
            size={16}
            style={styles.infoIcon}
          />
          <AppText style={styles.infoLabel}>Discount</AppText>
          <AppText style={styles.infoValue}>{discountLabel}</AppText>
        </View>
        <View style={styles.infoRow}>
          <Ionicons
            color={colors.textMuted}
            name="calendar-outline"
            size={16}
            style={styles.infoIcon}
          />
          <AppText style={styles.infoLabel}>Dates</AppText>
          <AppText numberOfLines={2} style={styles.infoValue}>
            {dateRange}
          </AppText>
        </View>
        {isPromo ? (
          <View style={styles.infoRow}>
            <Ionicons
              color={colors.textMuted}
              name="people-outline"
              size={16}
              style={styles.infoIcon}
            />
            <AppText style={styles.infoLabel}>Uses</AppText>
            <AppText style={styles.infoValue}>{campaign.currentUseCount ?? 0}</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.actionsDivider} />

      <View style={styles.bottomRow}>
        <View style={styles.actionGroup}>
          <Pressable
            accessibilityLabel="Edit"
            accessibilityRole="button"
            disabled={actionsDisabled}
            hitSlop={4}
            style={[styles.actionButton, actionsDisabled && { opacity: 0.45 }]}
            onPress={onEdit}
          >
            <Ionicons color={EDIT_ACCENT} name="create-outline" size={20} />
          </Pressable>
          <Pressable
            accessibilityLabel="Delete"
            accessibilityRole="button"
            disabled={actionsDisabled}
            hitSlop={4}
            style={[styles.actionButton, actionsDisabled && { opacity: 0.45 }]}
            onPress={onDelete}
          >
            <Ionicons color={DELETE_ACCENT} name="trash-outline" size={20} />
          </Pressable>
        </View>
        <View style={styles.toggleWrap}>
          <Switch
            accessibilityLabel={enabled ? 'Turn off' : 'Turn on'}
            disabled={actionsDisabled}
            onValueChange={onToggleEnabled}
            thumbColor={enabled ? '#f8fafc' : '#f4f4f5'}
            trackColor={{ false: colors.borderStrong, true: '#10b981' }}
            value={enabled}
          />
        </View>
      </View>
    </SurfaceCard>
  );
}
