import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { TEAM_MEMBER_STATUS_LABEL } from '../constants/teamMembersCopy';

function emailInitial(email) {
  const letter = String(email ?? '')
    .trim()
    .charAt(0);
  return letter ? letter.toUpperCase() : '?';
}

/**
 * One team member row — avatar, email, status, remove.
 * Row layout lives on inner Views (Pressable + flex on Text stacks on RN).
 */
export function TeamMemberRow({ member, showDividerBelow = true, onRemove }) {
  const { colors } = useTheme();
  const statusLabel = TEAM_MEMBER_STATUS_LABEL[member.status] ?? TEAM_MEMBER_STATUS_LABEL.active;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignSelf: 'stretch',
          width: '100%',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          width: '100%',
        },
        avatar: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 18,
          borderWidth: 1,
          height: 36,
          justifyContent: 'center',
          width: 36,
        },
        avatarLetter: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
        },
        textCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        email: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          letterSpacing: -0.2,
        },
        status: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 12,
          marginTop: 3,
        },
        removeCol: {
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
        },
        removeHit: {
          alignItems: 'center',
          height: 36,
          justifyContent: 'center',
          width: 36,
        },
        removePressed: {
          opacity: 0.7,
        },
        dividerRow: {
          flexDirection: 'row',
          paddingLeft: 64,
          paddingRight: 16,
        },
        hairline: {
          flex: 1,
          height: StyleSheet.hairlineWidth,
          opacity: 0.55,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <AppText style={styles.avatarLetter}>{emailInitial(member.email)}</AppText>
        </View>
        <View style={styles.textCol}>
          <AppText numberOfLines={1} style={styles.email}>
            {member.email}
          </AppText>
          <AppText style={styles.status}>{statusLabel}</AppText>
        </View>
        <View style={styles.removeCol}>
          <Pressable
            accessibilityLabel={`Remove ${member.email}`}
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => onRemove?.(member)}
          >
            {({ pressed }) => (
              <View style={[styles.removeHit, pressed && styles.removePressed]}>
                <Ionicons color={colors.textMuted} name="trash-outline" size={18} />
              </View>
            )}
          </Pressable>
        </View>
      </View>
      {showDividerBelow ? (
        <View style={styles.dividerRow}>
          <View style={[styles.hairline, { backgroundColor: colors.border }]} />
        </View>
      ) : null}
    </View>
  );
}
