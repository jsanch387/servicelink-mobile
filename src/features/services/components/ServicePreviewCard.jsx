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
 *   hideDescription?: boolean;
 *   style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
 * }} props
 */
export function ServicePreviewCard({
  service,
  selected = false,
  onPress,
  style,
  hideDescription = false,
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        serviceCard: {
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: hideDescription ? 12 : 16,
        },
        serviceTopRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
        },
        selectionLeading: {
          marginTop: 1,
        },
        serviceTitleWrap: {
          flex: 1,
          minWidth: 0,
        },
        serviceTitle: {
          ...serviceCardTitleStyle(colors),
          ...(hideDescription
            ? {
                fontWeight: '600',
                lineHeight: 21,
                letterSpacing: -0.3,
              }
            : null),
        },
        serviceTitleCompact: {
          flexShrink: 1,
        },
        durationUnderTitle: {
          alignItems: 'center',
          flexDirection: 'row',
          marginTop: 4,
        },
        durationUnderTitleText: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '500',
          marginLeft: 5,
        },
        priceCol: {
          alignItems: 'flex-end',
          flexShrink: 0,
        },
        selectionOuter: {
          borderRadius: 11,
          borderWidth: 2,
          height: 22,
          width: 22,
        },
        selectionSelected: {
          alignItems: 'center',
          borderRadius: 11,
          height: 22,
          justifyContent: 'center',
          width: 22,
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
          marginTop: hideDescription ? 8 : 10,
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
      }),
    [colors, hideDescription],
  );

  const borderColor = onPress && selected ? colors.accent : colors.border;
  const borderWidth = onPress && selected ? 2 : 1;
  const cardBackgroundColor = onPress && selected ? colors.buttonGhostPressed : colors.cardSurface;

  const selectionIndicator = onPress ? (
    selected ? (
      <View style={[styles.selectionSelected, { backgroundColor: colors.accent }]}>
        <Ionicons color={colors.shell} name="checkmark" size={14} />
      </View>
    ) : (
      <View style={[styles.selectionOuter, { borderColor: colors.borderStrong }]} />
    )
  ) : null;

  const cardFace = (
    <SurfaceCard
      outlined={false}
      padding="none"
      style={[
        styles.serviceCard,
        {
          backgroundColor: cardBackgroundColor,
          borderColor,
          borderWidth,
          ...(!onPress ? { marginBottom: 12 } : null),
        },
        style,
      ]}
    >
      <View style={styles.serviceTopRow}>
        {onPress ? <View style={styles.selectionLeading}>{selectionIndicator}</View> : null}
        <View style={styles.serviceTitleWrap}>
          <AppText style={[styles.serviceTitle, hideDescription && styles.serviceTitleCompact]}>
            {service.title}
          </AppText>
          {hideDescription ? (
            <View style={styles.durationUnderTitle}>
              <Ionicons color={colors.textMuted} name="time-outline" size={15} />
              <AppText numberOfLines={1} style={styles.durationUnderTitleText}>
                {service.duration}
              </AppText>
            </View>
          ) : null}
        </View>
        <View style={styles.priceCol}>
          <AppText style={styles.startingAt}>Starting at</AppText>
          <AppText style={styles.price}>{service.price}</AppText>
        </View>
      </View>
      {!hideDescription ? <View style={styles.headerDivider} /> : null}

      {!hideDescription ? (
        <>
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
        </>
      ) : null}

      {!hideDescription ? (
        <View style={styles.serviceBottomRow}>
          <View style={styles.durationRow}>
            <Ionicons color={colors.textMuted} name="time-outline" size={17} />
            <AppText numberOfLines={1} style={styles.durationText}>
              {service.duration}
            </AppText>
          </View>
        </View>
      ) : null}
    </SurfaceCard>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={selected ? `${service.title} selected` : `Select ${service.title}`}
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
