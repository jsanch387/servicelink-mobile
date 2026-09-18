import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { TEAM_MEMBER_STATUS_LABEL } from '../constants/teamMembersCopy';
import { emailInitial, teamMemberDisplayName } from '../utils/teamMemberDisplay';

/**
 * One team member card. Delete is the only tap target (v1 has no detail screen).
 * Row layout lives on inner Views (Pressable + flex on Text stacks on RN).
 */
export function TeamMemberCard({ member, onRemove }) {
  const { colors } = useTheme();
  const name = teamMemberDisplayName(member);
  const statusLabel = TEAM_MEMBER_STATUS_LABEL[member.status] ?? TEAM_MEMBER_STATUS_LABEL.active;
  const showEmailMeta = Boolean(member.name?.trim()) && Boolean(member.email?.trim());

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          paddingHorizontal: 14,
          paddingVertical: 14,
          width: '100%',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          width: '100%',
        },
        avatar: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 20,
          borderWidth: 1,
          height: 40,
          justifyContent: 'center',
          width: 40,
        },
        avatarLetter: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
        },
        textCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        name: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          letterSpacing: -0.2,
        },
        email: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          marginTop: 3,
        },
        statusCol: {
          flexShrink: 0,
        },
        status: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 12,
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
      }),
    [colors],
  );

  return (
    <SurfaceCard outlined padding="none" style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <AppText style={styles.avatarLetter}>{emailInitial(member.email || name)}</AppText>
        </View>
        <View style={styles.textCol}>
          <AppText numberOfLines={1} style={styles.name}>
            {name}
          </AppText>
          {showEmailMeta ? (
            <AppText numberOfLines={1} style={styles.email}>
              {member.email}
            </AppText>
          ) : (
            <AppText style={styles.email}>{statusLabel}</AppText>
          )}
        </View>
        {showEmailMeta ? (
          <View style={styles.statusCol}>
            <AppText style={styles.status}>{statusLabel}</AppText>
          </View>
        ) : null}
        <View style={styles.removeCol}>
          <Pressable
            accessibilityHint="Asks you to confirm before removing this team member"
            accessibilityLabel={`Remove ${name}`}
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
    </SurfaceCard>
  );
}
