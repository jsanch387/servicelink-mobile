import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';

const ROW_PAD_H = 16;
const ICON_COL_W = 28;
const ICON_GAP = 12;

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.summary
 * @param {number} [props.summaryMaxLines]
 * @param {keyof typeof Ionicons.glyphMap} props.icon
 * @param {boolean} props.showDividerBelow
 * @param {() => void} props.onPress
 */
function EditHubRow({
  title,
  summary,
  summaryMaxLines = 2,
  icon,
  showDividerBelow = true,
  onPress,
}) {
  const { colors } = useTheme();
  const dividerInsetLeft = ROW_PAD_H + ICON_COL_W + ICON_GAP;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignSelf: 'stretch',
          overflow: 'hidden',
          width: '100%',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          minHeight: 64,
          paddingHorizontal: ROW_PAD_H,
          paddingVertical: 12,
          width: '100%',
        },
        pressed: {
          backgroundColor: colors.buttonGhostPressed,
        },
        iconWrap: {
          alignItems: 'center',
          height: ICON_COL_W,
          justifyContent: 'center',
          marginRight: ICON_GAP,
          width: ICON_COL_W,
        },
        textCol: {
          flex: 1,
          gap: 3,
          justifyContent: 'center',
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        summary: {
          color: colors.textMuted,
          fontSize: 13,
          letterSpacing: -0.05,
          lineHeight: 18,
        },
        chevronCol: {
          alignItems: 'center',
          height: 22,
          justifyContent: 'center',
          marginLeft: 8,
          width: 22,
        },
        dividerRow: {
          flexDirection: 'row',
          paddingLeft: dividerInsetLeft,
          paddingRight: ROW_PAD_H,
        },
        hairline: {
          backgroundColor: colors.border,
          flex: 1,
          height: StyleSheet.hairlineWidth,
          opacity: 0.55,
        },
      }),
    [colors, dividerInsetLeft],
  );

  return (
    <View style={styles.root}>
      <Pressable accessibilityRole="button" onPress={onPress}>
        {({ pressed }) => (
          <View style={[styles.row, pressed && styles.pressed]}>
            <View style={styles.iconWrap}>
              <Ionicons color={colors.textMuted} name={icon} size={22} />
            </View>
            <View style={styles.textCol}>
              <AppText numberOfLines={1} style={styles.title}>
                {title}
              </AppText>
              <AppText ellipsizeMode="tail" numberOfLines={summaryMaxLines} style={styles.summary}>
                {summary}
              </AppText>
            </View>
            <View style={styles.chevronCol}>
              <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
            </View>
          </View>
        )}
      </Pressable>
      {showDividerBelow ? (
        <View style={styles.dividerRow}>
          <View style={styles.hairline} />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Edit hub — tap a section to jump straight to that wizard step.
 *
 * @param {object} props
 * @param {import('../utils/buildEditHubSections').EditHubSection[]} props.sections
 * @param {(step: number) => void} props.onOpenSection
 */
export function EditAppointmentHub({ sections, onOpenSection }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          rowGap: 16,
        },
        header: {
          gap: 6,
          paddingBottom: 2,
        },
        heading: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 20,
          fontWeight: '600',
          letterSpacing: -0.35,
          lineHeight: 26,
        },
        subtext: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '400',
          letterSpacing: -0.05,
          lineHeight: 16,
        },
        card: {
          overflow: 'hidden',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText style={styles.heading}>What do you want to change?</AppText>
        <AppText style={styles.subtext}>Tap a section to make a change.</AppText>
      </View>
      <SurfaceCard outlined padding="none" style={styles.card}>
        {sections.map((section, index) => (
          <EditHubRow
            icon={section.icon}
            key={section.id}
            showDividerBelow={index < sections.length - 1}
            summary={section.summary}
            summaryMaxLines={section.summaryMaxLines ?? 2}
            title={section.title}
            onPress={() => onOpenSection(section.step)}
          />
        ))}
      </SurfaceCard>
    </View>
  );
}
