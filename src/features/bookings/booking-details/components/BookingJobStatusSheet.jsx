import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Vibration, View } from 'react-native';
import { AppText, BottomSheetModal } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';

/** @typedef {'on_the_way' | 'start_job' | 'work_finished'} JobStatusActionId */

/**
 * @typedef {object} JobStatusAction
 * @property {JobStatusActionId} id
 * @property {keyof typeof Ionicons.glyphMap} icon
 * @property {string} title
 * @property {string} accessibilityHint
 * @property {string} iconColor
 * @property {string} iconBg
 */

/**
 * Visit progress actions (may text the customer).
 * Distinct from Actions → Complete (payment / receipt / official closeout).
 *
 * @param {boolean} isDark
 * @returns {JobStatusAction[]}
 */
function buildActions(isDark) {
  return [
    {
      id: 'on_the_way',
      icon: 'car-outline',
      title: 'On my way',
      accessibilityHint: 'Texts the customer that you are headed over',
      iconColor: isDark ? '#93c5fd' : '#2563eb',
      iconBg: isDark ? 'rgba(147, 197, 253, 0.18)' : 'rgba(37, 99, 235, 0.12)',
    },
    {
      id: 'start_job',
      icon: 'play-outline',
      title: 'Start job',
      accessibilityHint: 'Texts the customer that work has started',
      iconColor: isDark ? '#c4b5fd' : '#7c3aed',
      iconBg: isDark ? 'rgba(167, 139, 250, 0.18)' : 'rgba(124, 58, 237, 0.12)',
    },
    {
      id: 'work_finished',
      icon: 'checkmark-outline',
      title: 'Work finished',
      accessibilityHint:
        'Texts the customer that work is finished. Still use Complete for payment and closeout.',
      iconColor: isDark ? '#86efac' : '#16a34a',
      iconBg: isDark ? 'rgba(74, 222, 128, 0.18)' : 'rgba(22, 163, 74, 0.12)',
    },
  ];
}
/**
 * Neutral card row with colored icon containers.
 *
 * @param {{
 *   action: JobStatusAction;
 *   onPress: () => void;
 * }} props
 */
function JobStatusActionRow({ action, onPress }) {
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignSelf: 'stretch',
          borderRadius: 14,
          overflow: 'hidden',
          width: '100%',
        },
        row: {
          alignItems: 'center',
          backgroundColor: isDark ? '#0f0f0f' : colors.cardSurface,
          borderRadius: 14,
          flexDirection: 'row',
          minHeight: 64,
          paddingHorizontal: 14,
          paddingVertical: 14,
          width: '100%',
        },
        rowPressed: {
          backgroundColor: isDark ? '#141414' : colors.buttonGhostPressed,
        },
        iconBadge: {
          alignItems: 'center',
          borderRadius: 12,
          flexShrink: 0,
          height: 40,
          justifyContent: 'center',
          marginRight: 14,
          width: 40,
        },
        title: {
          color: colors.text,
          flex: 1,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
          minWidth: 0,
        },
        chevron: {
          flexShrink: 0,
          marginLeft: 8,
        },
      }),
    [colors, isDark],
  );

  const fireHaptic = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
      Vibration.vibrate(6);
    });
  }, []);

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityHint={action.accessibilityHint}
        accessibilityLabel={action.title}
        accessibilityRole="button"
        onPress={() => {
          fireHaptic();
          onPress();
        }}
      >
        {({ pressed }) => (
          <View style={[styles.row, pressed && styles.rowPressed]}>
            <View style={[styles.iconBadge, { backgroundColor: action.iconBg }]}>
              <Ionicons color={action.iconColor} name={action.icon} size={22} />
            </View>
            <AppText numberOfLines={1} style={styles.title}>
              {action.title}
            </AppText>
            <Ionicons
              color={colors.textMuted}
              name="chevron-forward"
              size={18}
              style={styles.chevron}
            />
          </View>
        )}
      </Pressable>
    </View>
  );
}

/**
 * UI shell for booking job-status actions (not wired to the API yet).
 * Uses experimental glass sheet (same as On my way confirm).
 *
 * @param {{
 *   visible: boolean;
 *   onRequestClose: () => void;
 * }} props
 */
export function BookingJobStatusSheet({ visible, onRequestClose }) {
  const { colors, isDark } = useTheme();
  const actions = useMemo(() => buildActions(isDark), [isDark]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          gap: 10,
          paddingBottom: 6,
          paddingTop: 8,
          width: '100%',
        },
        footnote: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          lineHeight: 17,
          marginTop: 6,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <BottomSheetModal
      appearance="glass"
      fitContent
      showCloseButton
      showHeaderDivider={false}
      title="Job status"
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View style={styles.body}>
        {actions.map((action) => (
          <JobStatusActionRow key={action.id} action={action} onPress={onRequestClose} />
        ))}
        <AppText style={styles.footnote}>
          You will still need to mark the appointment complete.
        </AppText>
      </View>
    </BottomSheetModal>
  );
}
