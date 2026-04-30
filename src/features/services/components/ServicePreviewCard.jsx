import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import {
  SERVICE_CARD_TITLE_SYSTEM_FONT,
  serviceCardTitleStyle,
} from '../../../utils/serviceCardTypography';
import { getServiceDescriptionCopy } from '../utils/servicePreviewCopy';

/**
 * Read-only service card: booking-link services tab and create-appointment service pick.
 * @param {{
 *   service: {
 *     id: string;
 *     title: string;
 *     price: string;
 *     description: string;
 *     isLongDescription: boolean;
 *     duration: string;
 *   };
 *   selected?: boolean;
 *   onPress?: () => void;
 *   style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
 * }} props
 */
export function ServicePreviewCard({ service, selected = false, onPress, style }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        serviceCard: {
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        serviceTopRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        serviceTitle: {
          ...serviceCardTitleStyle(colors),
        },
        startingAt: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '500',
          marginBottom: 3,
          textAlign: 'right',
        },
        price: {
          color: colors.text,
          fontFamily: SERVICE_CARD_TITLE_SYSTEM_FONT,
          fontSize: 20,
          fontWeight: '900',
          lineHeight: 24,
          textAlign: 'right',
        },
        headerDivider: {
          backgroundColor: 'rgba(255,255,255,0.06)',
          height: 1,
          marginBottom: 10,
          marginTop: 6,
        },
        serviceItemText: {
          color: colors.textMuted,
          fontSize: 14,
          lineHeight: 21,
          marginBottom: 2,
        },
        seeMoreRow: {
          alignItems: 'center',
          flexDirection: 'row',
          marginLeft: -4,
          marginTop: 8,
          minHeight: 34,
          paddingHorizontal: 4,
        },
        seeMoreText: {
          color: colors.textSecondary,
          fontSize: 12,
          fontWeight: '500',
          marginLeft: 6,
        },
        serviceBottomRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 10,
        },
        durationRow: {
          alignItems: 'center',
          flexDirection: 'row',
          flexShrink: 1,
          minWidth: 0,
        },
        durationText: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '500',
          marginLeft: 6,
        },
        selectLabel: {
          color: colors.accent,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.2,
          marginLeft: 12,
        },
        selectLabelMuted: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.2,
          marginLeft: 12,
        },
      }),
    [colors],
  );

  const borderColor = onPress && selected ? colors.accent : colors.border;
  const borderWidth = onPress && selected ? 2 : 1;

  const cardFace = (
    <SurfaceCard
      outlined={false}
      padding="none"
      style={[
        styles.serviceCard,
        {
          backgroundColor: colors.cardSurface,
          borderColor,
          borderWidth,
          ...(!onPress ? { marginBottom: 12 } : null),
        },
        style,
      ]}
    >
      <View style={styles.serviceTopRow}>
        <AppText style={styles.serviceTitle}>{service.title}</AppText>
        <View>
          <AppText style={styles.startingAt}>Starting at</AppText>
          <AppText style={styles.price}>{service.price}</AppText>
        </View>
      </View>
      <View style={styles.headerDivider} />

      <AppText style={styles.serviceItemText}>
        {getServiceDescriptionCopy(service, expanded)}
      </AppText>

      {service.isLongDescription ? (
        <Pressable
          accessibilityRole="button"
          style={styles.seeMoreRow}
          onPress={() => setExpanded((v) => !v)}
        >
          <Ionicons
            color={colors.textMuted}
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
          />
          <AppText style={styles.seeMoreText}>{expanded ? 'See less' : 'See more'}</AppText>
        </Pressable>
      ) : null}

      <View style={styles.serviceBottomRow}>
        <View style={styles.durationRow}>
          <Ionicons color={colors.textMuted} name="time-outline" size={17} />
          <AppText numberOfLines={1} style={styles.durationText}>
            {service.duration}
          </AppText>
        </View>
        {onPress ? (
          <AppText style={selected ? styles.selectLabelMuted : styles.selectLabel}>
            {selected ? 'Selected' : 'Select'}
          </AppText>
        ) : null}
      </View>
    </SurfaceCard>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={{ marginBottom: 12 }}
        onPress={onPress}
      >
        {cardFace}
      </Pressable>
    );
  }

  return cardFace;
}
